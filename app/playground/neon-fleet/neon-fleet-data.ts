export type Cell = { x: number; y: number };
export type Orientation = "horizontal" | "vertical";
export type Difficulty = "easy" | "normal" | "hard";
export type MatchPhase = "setup" | "playerTurn" | "aiTurn" | "victory" | "defeat";
export type ShotResult = "miss" | "hit" | "sunk";
export type ShipId = "carrier" | "battleship" | "cruiser" | "submarine" | "destroyer";

export interface ShipDefinition {
  id: ShipId;
  name: string;
  length: number;
}

export interface PlacedShip extends ShipDefinition {
  orientation: Orientation;
  cells: Cell[];
  hits: string[];
}

export interface BoardState {
  ships: PlacedShip[];
  shots: Record<string, ShotResult>;
}

export const BOARD_SIZE = 10;

export const FLEET = [
  { id: "carrier", name: "Carrier", length: 5 },
  { id: "battleship", name: "Battleship", length: 4 },
  { id: "cruiser", name: "Cruiser", length: 3 },
  { id: "submarine", name: "Submarine", length: 3 },
  { id: "destroyer", name: "Destroyer", length: 2 },
] as const satisfies readonly ShipDefinition[];

export const DIFFICULTIES = {
  easy: { label: "Easy" },
  normal: { label: "Normal" },
  hard: { label: "Hard" },
} as const satisfies Record<Difficulty, { label: string }>;

export const cellKey = ({ x, y }: Cell) => `${x}:${y}`;

export const parseCellKey = (key: string): Cell | null => {
  const match = /^(-?\d+):(-?\d+)$/.exec(key);
  if (!match) return null;

  const x = Number(match[1]);
  const y = Number(match[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return null;
  }

  return { x, y };
};
