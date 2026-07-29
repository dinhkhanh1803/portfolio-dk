export type BrickKind = "standard" | "reinforced" | "indestructible";

export type LevelBrick = {
  id: string;
  kind: BrickKind;
  column: number;
  row: number;
};

export type LevelDefinition = {
  id: number;
  name: string;
  seed: number;
  bricks: readonly LevelBrick[];
};

const fromPattern = (
  id: number,
  name: string,
  seed: number,
  rows: readonly string[],
): LevelDefinition => ({
  id,
  name,
  seed,
  bricks: rows.flatMap((row, rowIndex) =>
    [...row].flatMap((cell, column) => {
      const kind: BrickKind | null = cell === "S"
        ? "standard"
        : cell === "R"
          ? "reinforced"
          : cell === "I"
            ? "indestructible"
            : null;
      return kind
        ? [{ id: `l${id}-r${rowIndex}-c${column}`, kind, row: rowIndex, column }]
        : [];
    }),
  ),
});

export const LEVELS: readonly LevelDefinition[] = [
  fromPattern(1, "First Light", 101, [
    "SSSSSSSSSS",
    "SSSSSSSSSS",
    ".SSSSSSSS.",
    "..SSSSSS..",
  ]),
  fromPattern(2, "Twin Gates", 211, [
    "RRSSSSSSRR",
    "SSS....SSS",
    "SSS.II.SSS",
    "SSSSSSSSSS",
  ]),
  fromPattern(3, "Neon Heart", 307, [
    ".SS....SS.",
    "SSSS..SSSS",
    "SSRSSSSRSS",
    ".SSRSSRSS.",
    "..SSRRSS..",
  ]),
  fromPattern(4, "Circuit Lock", 401, [
    "I.SSSSSS.I",
    "SSRRRRRRSS",
    "SS.I..I.SS",
    "SSRRRRRRSS",
    "I.SSSSSS.I",
  ]),
  fromPattern(5, "Core Fortress", 503, [
    "IRRRRRRRRI",
    "RSSSSSSSSR",
    "RSI.RR.ISR",
    "RSSSSSSSSR",
    "IRRRRRRRRI",
  ]),
];
