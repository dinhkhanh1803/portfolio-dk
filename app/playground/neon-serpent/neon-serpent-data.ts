export const GRID = { columns: 24, rows: 16, width: 960, height: 640 } as const;

export type Difficulty = "easy" | "normal" | "hard";
export type SkillType = "shield" | "magnet" | "slowTime" | "phase" | "scoreBoost";
export type HazardKind = "wall" | "portal" | "laser" | "hunter" | "contract";
export type BossType = "sentinel" | "hydra";
export type Cell = { x: number; y: number };

export type StageDefinition = {
  id: number;
  name: string;
  subtitle: string;
  target: number;
  tickMs: number;
  hazards: HazardKind[];
  walls: Cell[];
  portals?: [Cell, Cell];
  boss?: BossType;
};

export const DIFFICULTIES = {
  easy: { lives: 3, speedScale: 1.14, comboMs: 3800, startingShield: 1, hazardScale: 0.82, scoreScale: 0.85 },
  normal: { lives: 3, speedScale: 1, comboMs: 3000, startingShield: 0, hazardScale: 1, scoreScale: 1 },
  hard: { lives: 2, speedScale: 0.86, comboMs: 2300, startingShield: 0, hazardScale: 1.2, scoreScale: 1.35 },
} as const;

export const SKILLS = {
  shield: { durationMs: 0, maxCharges: 2, symbol: "S", label: "Shield", color: "#36e4ff" },
  magnet: { durationMs: 8000, maxCharges: 1, symbol: "M", label: "Magnet", color: "#ffcc66" },
  slowTime: { durationMs: 6000, maxCharges: 1, symbol: "T", label: "Slow Time", color: "#9e8cff" },
  phase: { durationMs: 4000, maxCharges: 1, symbol: "P", label: "Phase", color: "#ff77c8" },
  scoreBoost: { durationMs: 10000, maxCharges: 1, symbol: "2x", label: "Score Boost", color: "#7cff9d" },
} as const;

const horizontal = (y: number, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));

const vertical = (x: number, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ x, y: from + index }));

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    name: "First Light",
    subtitle: "Learn the pulse",
    target: 8,
    tickMs: 150,
    hazards: [],
    walls: [],
  },
  {
    id: 2,
    name: "Cross Current",
    subtitle: "Read the lanes",
    target: 10,
    tickMs: 142,
    hazards: ["wall"],
    walls: [
      ...horizontal(4, 4, 8),
      ...horizontal(11, 15, 19),
      ...vertical(12, 6, 9),
    ],
  },
  {
    id: 3,
    name: "Twin Gates",
    subtitle: "Fold the grid",
    target: 12,
    tickMs: 136,
    hazards: ["wall", "portal"],
    walls: [...vertical(7, 3, 6), ...vertical(16, 9, 12)],
    portals: [{ x: 3, y: 12 }, { x: 20, y: 3 }],
  },
  {
    id: 4,
    name: "Sentinel Grid",
    subtitle: "Break the shield",
    target: 8,
    tickMs: 132,
    hazards: ["laser"],
    walls: [{ x: 4, y: 3 }, { x: 19, y: 3 }, { x: 4, y: 12 }, { x: 19, y: 12 }],
    boss: "sentinel",
  },
  {
    id: 5,
    name: "Tail Hunter",
    subtitle: "Never stop moving",
    target: 14,
    tickMs: 126,
    hazards: ["wall", "hunter"],
    walls: [...horizontal(5, 8, 15), ...horizontal(10, 8, 15)],
  },
  {
    id: 6,
    name: "Time Fracture",
    subtitle: "Move between beats",
    target: 15,
    tickMs: 121,
    hazards: ["laser", "portal"],
    walls: [{ x: 5, y: 4 }, { x: 18, y: 4 }, { x: 5, y: 11 }, { x: 18, y: 11 }],
    portals: [{ x: 2, y: 2 }, { x: 21, y: 13 }],
  },
  {
    id: 7,
    name: "Closing Circuit",
    subtitle: "Own the center",
    target: 16,
    tickMs: 116,
    hazards: ["contract", "laser"],
    walls: [],
  },
  {
    id: 8,
    name: "Neon Hydra",
    subtitle: "Three heads, one path",
    target: 12,
    tickMs: 112,
    hazards: ["laser", "portal", "hunter", "contract"],
    walls: [{ x: 5, y: 4 }, { x: 18, y: 4 }, { x: 5, y: 11 }, { x: 18, y: 11 }],
    portals: [{ x: 3, y: 13 }, { x: 20, y: 2 }],
    boss: "hydra",
  },
];

export const getStage = (stage: number) => STAGES[Math.max(0, Math.min(STAGES.length - 1, stage - 1))];
