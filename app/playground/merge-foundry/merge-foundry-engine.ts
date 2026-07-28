export type MaterialTier = 1 | 2 | 3 | 4 | 5;
export type Cell = MaterialTier | null;
export type Board = Cell[];
export type Direction = "up" | "down" | "left" | "right";

export type MergeEvent = {
  from: number[];
  to: number;
  tier: MaterialTier;
};

export type BoardMove = {
  board: Board;
  changed: boolean;
  merges: MergeEvent[];
};

type MovingCell = {
  tier: MaterialTier;
  source: number;
};

function assertBoard(board: Board) {
  if (
    board.length !== 25 ||
    board.some(
      (cell) =>
        cell !== null &&
        (!Number.isInteger(cell) || cell < 1 || cell > 5),
    )
  ) {
    throw new Error("Merge Foundry boards must contain 25 valid cells.");
  }
}

function lineIndexes(direction: Direction) {
  return Array.from({ length: 5 }, (_, line) =>
    Array.from({ length: 5 }, (_, offset) => {
      if (direction === "left") return line * 5 + offset;
      if (direction === "right") return line * 5 + (4 - offset);
      if (direction === "up") return offset * 5 + line;
      return (4 - offset) * 5 + line;
    }),
  );
}

function sameBoard(first: Board, second: Board) {
  return first.every((cell, index) => cell === second[index]);
}

export function moveBoard(board: Board, direction: Direction): BoardMove {
  assertBoard(board);
  const nextBoard: Board = Array(25).fill(null);
  const merges: MergeEvent[] = [];

  for (const indexes of lineIndexes(direction)) {
    const compact = indexes.flatMap<MovingCell>((index) => {
      const tier = board[index];
      return tier === null ? [] : [{ tier, source: index }];
    });
    const resolved: Array<MovingCell & { mergedFrom?: number[] }> = [];

    for (let index = 0; index < compact.length; index += 1) {
      const current = compact[index];
      const following = compact[index + 1];
      if (following && following.tier === current.tier) {
        resolved.push({
          tier: Math.min(5, current.tier + 1) as MaterialTier,
          source: current.source,
          mergedFrom: [current.source, following.source],
        });
        index += 1;
      } else {
        resolved.push(current);
      }
    }

    resolved.forEach((cell, offset) => {
      const destination = indexes[offset];
      nextBoard[destination] = cell.tier;
      if (cell.mergedFrom) {
        merges.push({
          from: cell.mergedFrom,
          to: destination,
          tier: cell.tier,
        });
      }
    });
  }

  return {
    board: nextBoard,
    changed: !sameBoard(board, nextBoard),
    merges,
  };
}
