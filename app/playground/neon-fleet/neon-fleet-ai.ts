import {
  BOARD_SIZE,
  cellKey,
  parseCellKey,
  type Cell,
  type Difficulty,
  type ShotResult,
} from "./neon-fleet-data.ts";

export type AiKnowledge = {
  shots: Record<string, ShotResult>;
  remainingLengths: number[];
};

type SeededChoice = { cell: Cell | null; seed: number };

const isInBounds = ({ x, y }: Cell) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

const nextRandom = (seed: number) => {
  const next = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};

const compareCells = (left: Cell, right: Cell) => left.y - right.y || left.x - right.x;

const allCells = (): Cell[] => {
  const cells: Cell[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) cells.push({ x, y });
  }
  return cells;
};

export const legalCells = (shots: Record<string, ShotResult>): Cell[] =>
  allCells().filter((cell) => !Object.hasOwn(shots, cellKey(cell)));

export const selectSeededCell = (cells: readonly Cell[], seed: number): SeededChoice => {
  const normalizedSeed = seed >>> 0;
  if (cells.length === 0) return { cell: null, seed: normalizedSeed };

  const random = nextRandom(normalizedSeed);
  return { cell: cells[Math.floor(random.value * cells.length)], seed: random.seed };
};

export const orthogonalNeighbors = (cell: Cell): Cell[] => [
  { x: cell.x, y: cell.y - 1 },
  { x: cell.x - 1, y: cell.y },
  { x: cell.x + 1, y: cell.y },
  { x: cell.x, y: cell.y + 1 },
].filter(isInBounds);

const unresolvedHitClusters = (shots: Record<string, ShotResult>): Cell[][] => {
  const hits = Object.entries(shots)
    .filter(([, result]) => result === "hit")
    .map(([key]) => parseCellKey(key))
    .filter((cell): cell is Cell => cell !== null)
    .sort(compareCells);
  const remaining = new Map(hits.map((cell) => [cellKey(cell), cell]));
  const clusters: Cell[][] = [];

  while (remaining.size > 0) {
    const first = [...remaining.values()].sort(compareCells)[0];
    const cluster: Cell[] = [];
    const pending = [first];
    remaining.delete(cellKey(first));

    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) continue;
      cluster.push(current);
      for (const neighbor of orthogonalNeighbors(current)) {
        const key = cellKey(neighbor);
        const hit = remaining.get(key);
        if (hit) {
          remaining.delete(key);
          pending.push(hit);
        }
      }
    }
    clusters.push(cluster.sort(compareCells));
  }

  return clusters;
};

export const targetCandidates = (knowledge: AiKnowledge): Cell[] => {
  const legal = new Set(legalCells(knowledge.shots).map(cellKey));
  const candidates = new Map<string, Cell>();
  const add = (cell: Cell) => {
    const key = cellKey(cell);
    if (legal.has(key)) candidates.set(key, cell);
  };

  for (const cluster of unresolvedHitClusters(knowledge.shots)) {
    const sameRow = cluster.length >= 2 && new Set(cluster.map((cell) => cell.y)).size === 1;
    const sameColumn = cluster.length >= 2 && new Set(cluster.map((cell) => cell.x)).size === 1;
    if (sameRow) {
      const y = cluster[0].y;
      const xs = cluster.map((cell) => cell.x);
      add({ x: Math.min(...xs) - 1, y });
      add({ x: Math.max(...xs) + 1, y });
    } else if (sameColumn) {
      const x = cluster[0].x;
      const ys = cluster.map((cell) => cell.y);
      add({ x, y: Math.min(...ys) - 1 });
      add({ x, y: Math.max(...ys) + 1 });
    } else {
      for (const hit of cluster) for (const neighbor of orthogonalNeighbors(hit)) add(neighbor);
    }
  }

  return [...candidates.values()].sort(compareCells);
};

const isPlacementBlocked = (shots: Record<string, ShotResult>, cell: Cell) =>
  shots[cellKey(cell)] === "miss" || shots[cellKey(cell)] === "sunk";

export const probabilityScores = (knowledge: AiKnowledge): Map<string, number> => {
  const scores = new Map<string, number>();
  const lengths = knowledge.remainingLengths.filter((length) => Number.isInteger(length) && length > 0 && length <= BOARD_SIZE);
  const addPlacement = (placement: Cell[]) => {
    if (placement.some((cell) => isPlacementBlocked(knowledge.shots, cell))) return;
    for (const cell of placement) {
      const key = cellKey(cell);
      if (Object.hasOwn(knowledge.shots, key)) continue;
      scores.set(key, (scores.get(key) ?? 0) + 1);
    }
  };

  for (const length of lengths) {
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x <= BOARD_SIZE - length; x += 1) {
        addPlacement(Array.from({ length }, (_, index) => ({ x: x + index, y })));
      }
    }
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      for (let y = 0; y <= BOARD_SIZE - length; y += 1) {
        addPlacement(Array.from({ length }, (_, index) => ({ x, y: y + index })));
      }
    }
  }
  return scores;
};

const highestScoringCells = (scores: ReadonlyMap<string, number>): Cell[] => {
  const maximum = Math.max(...scores.values());
  if (!Number.isFinite(maximum)) return [];
  return [...scores.entries()]
    .filter(([, score]) => score === maximum)
    .map(([key]) => parseCellKey(key))
    .filter((cell): cell is Cell => cell !== null)
    .sort(compareCells);
};

export const chooseAiShot = (difficulty: Difficulty, knowledge: AiKnowledge, seed: number): SeededChoice => {
  const legal = legalCells(knowledge.shots);
  if (legal.length === 0) return selectSeededCell([], seed);
  if (difficulty === "easy") return selectSeededCell(legal, seed);

  const targets = targetCandidates(knowledge);
  if (targets.length > 0) return selectSeededCell(targets, seed);
  if (difficulty === "normal") return selectSeededCell(legal, seed);

  const scored = highestScoringCells(probabilityScores(knowledge));
  return selectSeededCell(scored.length > 0 ? scored : legal, seed);
};
