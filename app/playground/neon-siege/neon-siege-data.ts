export type Difficulty = "easy" | "normal" | "hard";
export type TowerType = "pulse" | "frost" | "tesla" | "railgun";
export type EnemyType = "drone" | "runner" | "tank" | "splitter" | "disruptor" | "boss";

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 640;

export const ROUTE = [
  { x: -20, y: 310 },
  { x: 165, y: 310 },
  { x: 165, y: 135 },
  { x: 405, y: 135 },
  { x: 405, y: 485 },
  { x: 690, y: 485 },
  { x: 690, y: 255 },
  { x: 980, y: 255 },
] as const;

export const BUILD_PADS = [
  { id: "pad-01", x: 105, y: 225 },
  { id: "pad-02", x: 255, y: 225 },
  { id: "pad-03", x: 310, y: 70 },
  { id: "pad-04", x: 495, y: 205 },
  { id: "pad-05", x: 315, y: 390 },
  { id: "pad-06", x: 500, y: 405 },
  { id: "pad-07", x: 585, y: 555 },
  { id: "pad-08", x: 775, y: 555 },
  { id: "pad-09", x: 605, y: 330 },
  { id: "pad-10", x: 790, y: 350 },
  { id: "pad-11", x: 835, y: 175 },
  { id: "pad-12", x: 525, y: 80 },
] as const;

export interface TowerLevel {
  cost: number;
  damage: number;
  range: number;
  fireMs: number;
}

export interface TowerDefinition {
  label: string;
  color: string;
  description: string;
  levels: readonly [TowerLevel, TowerLevel, TowerLevel];
}

export const TOWER_DEFINITIONS: Record<TowerType, TowerDefinition> = {
  pulse: {
    label: "Pulse",
    color: "#45f0ff",
    description: "Bắn nhanh vào mục tiêu dẫn đầu.",
    levels: [
      { cost: 70, damage: 14, range: 135, fireMs: 430 },
      { cost: 90, damage: 23, range: 148, fireMs: 350 },
      { cost: 135, damage: 38, range: 160, fireMs: 280 },
    ],
  },
  frost: {
    label: "Frost",
    color: "#78a7ff",
    description: "Làm chậm và gây sát thương khu vực.",
    levels: [
      { cost: 95, damage: 10, range: 130, fireMs: 850 },
      { cost: 120, damage: 17, range: 145, fireMs: 720 },
      { cost: 165, damage: 27, range: 160, fireMs: 610 },
    ],
  },
  tesla: {
    label: "Tesla",
    color: "#c477ff",
    description: "Sét chuỗi qua nhiều mục tiêu.",
    levels: [
      { cost: 125, damage: 20, range: 145, fireMs: 900 },
      { cost: 155, damage: 32, range: 160, fireMs: 770 },
      { cost: 210, damage: 49, range: 175, fireMs: 640 },
    ],
  },
  railgun: {
    label: "Railgun",
    color: "#ffca5c",
    description: "Xuyên giáp, bắn xuyên đội hình.",
    levels: [
      { cost: 155, damage: 54, range: 230, fireMs: 1450 },
      { cost: 190, damage: 84, range: 255, fireMs: 1250 },
      { cost: 250, damage: 128, range: 285, fireMs: 1050 },
    ],
  },
};

export interface EnemyDefinition {
  label: string;
  hp: number;
  speed: number;
  armor: number;
  threat: number;
  reward: number;
  color: string;
}

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  drone: { label: "Drone", hp: 48, speed: 58, armor: 0, threat: 1, reward: 10, color: "#45f0ff" },
  runner: { label: "Runner", hp: 38, speed: 94, armor: 0, threat: 1, reward: 12, color: "#ff6f91" },
  tank: { label: "Tank", hp: 185, speed: 33, armor: 8, threat: 2, reward: 26, color: "#ffbd59" },
  splitter: { label: "Splitter", hp: 112, speed: 46, armor: 3, threat: 2, reward: 22, color: "#61f5a8" },
  disruptor: { label: "Disruptor", hp: 150, speed: 40, armor: 5, threat: 2, reward: 30, color: "#c477ff" },
  boss: { label: "Overseer", hp: 850, speed: 23, armor: 12, threat: 5, reward: 120, color: "#ff5e6c" },
};

export interface WaveGroup {
  type: EnemyType;
  count: number;
  intervalMs: number;
  delayMs?: number;
}

export interface WaveDefinition {
  groups: WaveGroup[];
  bonus: number;
}

export const CAMPAIGN_WAVES: WaveDefinition[] = [
  { groups: [{ type: "drone", count: 8, intervalMs: 700 }], bonus: 45 },
  { groups: [{ type: "runner", count: 7, intervalMs: 620 }, { type: "drone", count: 5, intervalMs: 600, delayMs: 1500 }], bonus: 55 },
  { groups: [{ type: "tank", count: 4, intervalMs: 1100 }, { type: "drone", count: 8, intervalMs: 480 }], bonus: 65 },
  { groups: [{ type: "boss", count: 1, intervalMs: 1000, delayMs: 3200 }, { type: "runner", count: 10, intervalMs: 430 }], bonus: 85 },
  { groups: [{ type: "splitter", count: 7, intervalMs: 800 }, { type: "tank", count: 5, intervalMs: 950 }], bonus: 90 },
  { groups: [{ type: "disruptor", count: 5, intervalMs: 900 }, { type: "runner", count: 14, intervalMs: 360 }], bonus: 100 },
  { groups: [{ type: "tank", count: 8, intervalMs: 750 }, { type: "splitter", count: 8, intervalMs: 670 }], bonus: 110 },
  { groups: [{ type: "boss", count: 2, intervalMs: 3500 }, { type: "disruptor", count: 6, intervalMs: 780 }], bonus: 135 },
  { groups: [{ type: "runner", count: 24, intervalMs: 260 }, { type: "splitter", count: 10, intervalMs: 580 }], bonus: 145 },
  { groups: [{ type: "tank", count: 12, intervalMs: 600 }, { type: "disruptor", count: 10, intervalMs: 600 }], bonus: 160 },
  { groups: [{ type: "splitter", count: 16, intervalMs: 430 }, { type: "runner", count: 24, intervalMs: 230 }], bonus: 180 },
  { groups: [{ type: "boss", count: 3, intervalMs: 3300 }, { type: "tank", count: 12, intervalMs: 540 }, { type: "disruptor", count: 12, intervalMs: 520 }], bonus: 250 },
];

export const DIFFICULTY_SETTINGS = {
  easy: { credits: 520, health: 20, enemyHp: 0.82, enemySpeed: 0.92, reward: 1.15 },
  normal: { credits: 430, health: 20, enemyHp: 1, enemySpeed: 1, reward: 1 },
  hard: { credits: 350, health: 20, enemyHp: 1.25, enemySpeed: 1.12, reward: 0.9 },
} as const;
