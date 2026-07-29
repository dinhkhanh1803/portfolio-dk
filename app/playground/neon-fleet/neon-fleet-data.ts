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
  hits: Cell[];
}

export interface BoardState {
  ships: PlacedShip[];
  shots: Cell[];
}

export const BOARD_SIZE = 10;

export const FLEET: readonly ShipDefinition[] = [
  { id: "carrier", name: "Carrier", length: 5 },
  { id: "battleship", name: "Battleship", length: 4 },
  { id: "cruiser", name: "Cruiser", length: 3 },
  { id: "submarine", name: "Submarine", length: 3 },
  { id: "destroyer", name: "Destroyer", length: 2 },
];

export const DIFFICULTIES: Record<Difficulty, { label: string }> = {
  easy: { label: "Easy" },
  normal: { label: "Normal" },
  hard: { label: "Hard" },
};

export const cellKey = ({ x, y }: Cell) => `${x}:${y}`;

export const parseCellKey = (key: string): Cell => {
  const [x, y] = key.split(":").map(Number);
  return { x, y };
};
