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

  const maximalRuns = (cluster: Cell[], axis: "horizontal" | "vertical") => {
    const lines = new Map<number, Cell[]>();
    for (const cell of cluster) {
      const lineKey = axis === "horizontal" ? cell.y : cell.x;
      const line = lines.get(lineKey);
      if (line) line.push(cell);
      else lines.set(lineKey, [cell]);
    }

    const runs: Cell[][] = [];
    for (const cells of lines.values()) {
      const sorted = [...cells].sort((left, right) => (
        axis === "horizontal" ? left.x - right.x : left.y - right.y
      ));
      let run = [sorted[0]];
      for (const cell of sorted.slice(1)) {
        const previous = run[run.length - 1];
        const previousCoordinate = axis === "horizontal" ? previous.x : previous.y;
        const coordinate = axis === "horizontal" ? cell.x : cell.y;
        if (coordinate !== previousCoordinate + 1) {
          if (run.length >= 2) runs.push(run);
          run = [cell];
        } else {
          run.push(cell);
        }
      }
      if (run.length >= 2) runs.push(run);
    }
    return runs;
  };

  for (const cluster of unresolvedHitClusters(knowledge.shots)) {
    const represented = new Set<string>();
    const addRunExtensions = (run: Cell[], axis: "horizontal" | "vertical") => {
      for (const cell of run) represented.add(cellKey(cell));
      const first = run[0];
      const last = run[run.length - 1];
      if (axis === "horizontal") {
        add({ x: first.x - 1, y: first.y });
        add({ x: last.x + 1, y: last.y });
      } else {
        add({ x: first.x, y: first.y - 1 });
        add({ x: last.x, y: last.y + 1 });
      }
    };

    for (const run of maximalRuns(cluster, "horizontal")) addRunExtensions(run, "horizontal");
    for (const run of maximalRuns(cluster, "vertical")) addRunExtensions(run, "vertical");
    for (const hit of cluster) {
      if (represented.has(cellKey(hit))) continue;
      for (const neighbor of orthogonalNeighbors(hit)) add(neighbor);
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
