import {
  BUILD_PADS,
  CAMPAIGN_WAVES,
  DIFFICULTY_SETTINGS,
  ENEMY_DEFINITIONS,
  ROUTE,
  TOWER_DEFINITIONS,
  type Difficulty,
  type EnemyType,
  type TowerType,
  type WaveDefinition,
} from "./neon-siege-data.ts";

export type SiegePhase = "planning" | "playing" | "paused" | "victory" | "gameover";

export interface SiegeEnemy {
  id: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  progress: number;
  speed: number;
  armor: number;
  threat: number;
  reward: number;
  slowRemainingMs: number;
  stunRemainingMs: number;
}

export interface SiegeTower {
  id: number;
  padId: string;
  type: TowerType;
  level: number;
  cooldownMs: number;
  invested: number;
}

export interface PendingSpawn {
  type: EnemyType;
  spawnAtMs: number;
  ordinal: number;
}

export interface SiegeEvent {
  id: number;
  type: "shot" | "kill" | "leak" | "build" | "upgrade" | "sell" | "skill" | "wave";
  x?: number;
  y?: number;
  color?: string;
  label?: string;
}

export interface SiegeRun {
  difficulty: Difficulty;
  mode: "campaign" | "endless";
  phase: SiegePhase;
  wave: number;
  health: number;
  credits: number;
  score: number;
  combo: number;
  towers: SiegeTower[];
  enemies: SiegeEnemy[];
  pendingSpawns: PendingSpawn[];
  waveElapsedMs: number;
  campaignComplete: boolean;
  nextTowerId: number;
  nextEnemyId: number;
  nextEventId: number;
  event: SiegeEvent | null;
  skills: {
    empCooldownMs: number;
    overclockCooldownMs: number;
    overclockRemainingMs: number;
    airstrikeCooldownMs: number;
    airstrike: null | { progress: number; remainingMs: number };
  };
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

const SEGMENTS = ROUTE.slice(1).map((point, index) => {
  const from = ROUTE[index];
  return { from, to: point, length: distance(from, point) };
});

export const routeLength = () => SEGMENTS.reduce((total, segment) => total + segment.length, 0);

export const pointAtProgress = (progress: number) => {
  let remaining = clamp(progress, 0, routeLength());
  for (const segment of SEGMENTS) {
    if (remaining <= segment.length) {
      const ratio = segment.length ? remaining / segment.length : 0;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
        y: segment.from.y + (segment.to.y - segment.from.y) * ratio,
      };
    }
    remaining -= segment.length;
  }
  return { ...ROUTE[ROUTE.length - 1] };
};

const withEvent = (state: SiegeRun, event: Omit<SiegeEvent, "id">): SiegeRun => ({
  ...state,
  nextEventId: state.nextEventId + 1,
  event: { ...event, id: state.nextEventId },
});

export const createSiegeRun = (difficulty: Difficulty = "normal"): SiegeRun => {
  const setting = DIFFICULTY_SETTINGS[difficulty];
  return {
    difficulty,
    mode: "campaign",
    phase: "planning",
    wave: 0,
    health: setting.health,
    credits: setting.credits,
    score: 0,
    combo: 1,
    towers: [],
    enemies: [],
    pendingSpawns: [],
    waveElapsedMs: 0,
    campaignComplete: false,
    nextTowerId: 1,
    nextEnemyId: 1,
    nextEventId: 1,
    event: null,
    skills: {
      empCooldownMs: 0,
      overclockCooldownMs: 0,
      overclockRemainingMs: 0,
      airstrikeCooldownMs: 0,
      airstrike: null,
    },
  };
};

export const buildTower = (state: SiegeRun, padId: string, type: TowerType): SiegeRun => {
  if (state.phase !== "planning" || state.towers.some((tower) => tower.padId === padId)) return state;
  if (!BUILD_PADS.some((pad) => pad.id === padId)) return state;
  const cost = TOWER_DEFINITIONS[type]?.levels[0].cost;
  if (!cost || state.credits < cost) return state;
  const next: SiegeRun = {
    ...state,
    credits: state.credits - cost,
    nextTowerId: state.nextTowerId + 1,
    towers: [...state.towers, { id: state.nextTowerId, padId, type, level: 1, cooldownMs: 0, invested: cost }],
  };
  const pad = BUILD_PADS.find((item) => item.id === padId);
  return withEvent(next, { type: "build", x: pad?.x, y: pad?.y, color: TOWER_DEFINITIONS[type].color });
};

export const upgradeTower = (state: SiegeRun, towerId: number): SiegeRun => {
  if (state.phase !== "planning") return state;
  const tower = state.towers.find((item) => item.id === towerId);
  if (!tower || tower.level >= 3) return state;
  const cost = TOWER_DEFINITIONS[tower.type].levels[tower.level].cost;
  if (state.credits < cost) return state;
  const next = {
    ...state,
    credits: state.credits - cost,
    towers: state.towers.map((item) => item.id === towerId
      ? { ...item, level: item.level + 1, invested: item.invested + cost }
      : item),
  };
  return withEvent(next, { type: "upgrade", color: TOWER_DEFINITIONS[tower.type].color });
};

export const sellTower = (state: SiegeRun, towerId: number): SiegeRun => {
  if (state.phase !== "planning") return state;
  const tower = state.towers.find((item) => item.id === towerId);
  if (!tower) return state;
  return withEvent({
    ...state,
    credits: state.credits + Math.floor(tower.invested * 0.7),
    towers: state.towers.filter((item) => item.id !== towerId),
  }, { type: "sell", label: `+${Math.floor(tower.invested * 0.7)}` });
};

const scheduleWave = (wave: WaveDefinition): PendingSpawn[] => {
  const schedule: PendingSpawn[] = [];
  let cursor = 250;
  let ordinal = 0;
  for (const group of wave.groups) {
    cursor += group.delayMs ?? 0;
    for (let index = 0; index < group.count; index += 1) {
      schedule.push({ type: group.type, spawnAtMs: cursor + index * group.intervalMs, ordinal });
      ordinal += 1;
    }
    cursor += Math.max(0, group.count - 1) * group.intervalMs + 350;
  }
  return schedule;
};

export const generateEndlessWave = (wave: number, difficulty: Difficulty): WaveDefinition => {
  const index = Math.max(1, wave - 12);
  const types: EnemyType[] = ["drone", "runner", "tank", "splitter", "disruptor"];
  const first = types[(index * 7 + difficulty.length) % types.length];
  const second = types[(index * 3 + 2) % types.length];
  const groups = [
    { type: first, count: 9 + index * 2, intervalMs: Math.max(180, 620 - index * 16) },
    { type: second, count: 5 + index, intervalMs: Math.max(240, 820 - index * 13), delayMs: 900 },
  ];
  if (wave % 4 === 0) groups.push({ type: "boss", count: 1 + Math.floor(index / 8), intervalMs: 2600, delayMs: 1300 });
  return { groups, bonus: 180 + index * 24 };
};

export const startWave = (state: SiegeRun, earlyCall = false): SiegeRun => {
  if (state.phase !== "planning") return state;
  const wave = state.wave + 1;
  const definition = wave <= CAMPAIGN_WAVES.length
    ? CAMPAIGN_WAVES[wave - 1]
    : generateEndlessWave(wave, state.difficulty);
  const earlyBonus = earlyCall ? 18 + wave * 2 : 0;
  return withEvent({
    ...state,
    phase: "playing",
    wave,
    waveElapsedMs: 0,
    pendingSpawns: scheduleWave(definition),
    credits: state.credits + earlyBonus,
    combo: earlyCall ? state.combo + 1 : state.combo,
  }, { type: "wave", label: `WAVE ${wave}` });
};

export const startEndless = (state: SiegeRun, unlocked = state.campaignComplete): SiegeRun => {
  if (!unlocked || !["planning", "victory"].includes(state.phase)) return state;
  return { ...createSiegeRun(state.difficulty), mode: "endless", wave: 12, campaignComplete: true };
};

const spawnEnemy = (state: SiegeRun, type: EnemyType): SiegeRun => {
  const base = ENEMY_DEFINITIONS[type];
  const settings = DIFFICULTY_SETTINGS[state.difficulty];
  const endlessScale = state.wave > 12 ? 1 + (state.wave - 12) * 0.095 : 1;
  const hp = Math.round(base.hp * settings.enemyHp * endlessScale);
  const enemy: SiegeEnemy = {
    id: state.nextEnemyId,
    type,
    hp,
    maxHp: hp,
    progress: 0,
    speed: base.speed * settings.enemySpeed * Math.min(1.45, 1 + Math.max(0, state.wave - 1) * 0.012),
    armor: base.armor + (state.wave > 12 ? Math.floor((state.wave - 12) / 5) : 0),
    threat: base.threat,
    reward: Math.max(1, Math.round(base.reward * settings.reward)),
    slowRemainingMs: 0,
    stunRemainingMs: 0,
  };
  const spawned = { ...state, nextEnemyId: state.nextEnemyId + 1, enemies: [...state.enemies, enemy] };
  if (type !== "boss") return spawned;
  return withEvent({
    ...spawned,
    towers: spawned.towers.map((tower) => ({ ...tower, cooldownMs: tower.cooldownMs + 700 })),
  }, { type: "skill", label: "BOSS", color: ENEMY_DEFINITIONS.boss.color });
};

const towerPosition = (tower: SiegeTower) => BUILD_PADS.find((pad) => pad.id === tower.padId) ?? BUILD_PADS[0];
const effectiveDamage = (damage: number, armor: number, penetration = 0) => Math.max(1, damage - Math.max(0, armor - penetration));

const resolveKills = (state: SiegeRun, enemies: SiegeEnemy[]): SiegeRun => {
  const killed = enemies.filter((enemy) => enemy.hp <= 0);
  const survivors = enemies.filter((enemy) => enemy.hp > 0);
  let nextId = state.nextEnemyId;
  for (const enemy of killed) {
    if (enemy.type !== "splitter") continue;
    for (let part = 0; part < 2; part += 1) {
      const base = ENEMY_DEFINITIONS.drone;
      const hp = Math.round(base.hp * 0.7);
      survivors.push({
        id: nextId, type: "drone", hp, maxHp: hp, progress: Math.max(0, enemy.progress - part * 12),
        speed: base.speed * 1.08, armor: 0, threat: 1, reward: 4, slowRemainingMs: 0, stunRemainingMs: 0,
      });
      nextId += 1;
    }
  }
  if (!killed.length) return { ...state, enemies: survivors };
  return withEvent({
    ...state,
    enemies: survivors,
    nextEnemyId: nextId,
    credits: state.credits + killed.reduce((sum, enemy) => sum + enemy.reward, 0),
    score: state.score + killed.reduce((sum, enemy) => sum + enemy.reward, 0) * 10 * Math.max(1, state.combo),
    combo: state.combo + killed.length,
  }, { type: "kill", label: `+${killed.reduce((sum, enemy) => sum + enemy.reward, 0)}` });
};

const fireTowers = (state: SiegeRun, deltaMs: number): SiegeRun => {
  const enemies = state.enemies.map((enemy) => ({ ...enemy }));
  let event: SiegeEvent | null = state.event;
  const towers = state.towers.map((tower) => {
    let cooldownMs = tower.cooldownMs - deltaMs;
    if (cooldownMs > 0) return { ...tower, cooldownMs };
    const level = TOWER_DEFINITIONS[tower.type].levels[tower.level - 1];
    const position = towerPosition(tower);
    const inRange = enemies
      .filter((enemy) => enemy.hp > 0 && distance(position, pointAtProgress(enemy.progress)) <= level.range)
      .sort((a, b) => b.progress - a.progress);
    if (!inRange.length) return { ...tower, cooldownMs: 0 };
    const disrupted = enemies.some((enemy) => enemy.type === "disruptor"
      && enemy.hp > 0 && distance(position, pointAtProgress(enemy.progress)) < 125);
    const overclock = state.skills.overclockRemainingMs > 0 ? 0.6 : 1;
    cooldownMs += level.fireMs * (disrupted ? 1.35 : 1) * overclock;
    const damageEnemy = (target: SiegeEnemy, damage: number, penetration = 0) => {
      const index = enemies.findIndex((enemy) => enemy.id === target.id);
      if (index < 0) return;
      enemies[index] = { ...enemies[index], hp: enemies[index].hp - effectiveDamage(damage, enemies[index].armor, penetration) };
    };
    if (tower.type === "pulse") {
      damageEnemy(inRange[0], level.damage);
    } else if (tower.type === "frost") {
      const center = pointAtProgress(inRange[0].progress);
      for (const target of inRange.filter((enemy) => distance(center, pointAtProgress(enemy.progress)) <= 58)) {
        damageEnemy(target, level.damage);
        const index = enemies.findIndex((enemy) => enemy.id === target.id);
        enemies[index] = { ...enemies[index], slowRemainingMs: 1550 };
      }
    } else if (tower.type === "tesla") {
      const chain: SiegeEnemy[] = [inRange[0]];
      const remaining = inRange.slice(1);
      while (chain.length < 3 + Math.floor(tower.level / 3)) {
        const previous = pointAtProgress(chain[chain.length - 1].progress);
        const candidateIndex = remaining.findIndex((enemy) => distance(previous, pointAtProgress(enemy.progress)) <= 95);
        if (candidateIndex < 0) break;
        chain.push(remaining.splice(candidateIndex, 1)[0]);
      }
      chain.forEach((target, index) => damageEnemy(target, level.damage * (1 - index * 0.22)));
    } else {
      const primary = inRange[0];
      const primaryPoint = pointAtProgress(primary.progress);
      const vx = primaryPoint.x - position.x;
      const vy = primaryPoint.y - position.y;
      const magnitude = Math.max(1, Math.hypot(vx, vy));
      inRange.filter((target) => {
        const point = pointAtProgress(target.progress);
        const projection = ((point.x - position.x) * vx + (point.y - position.y) * vy) / magnitude;
        const perpendicular = Math.abs((point.x - position.x) * vy - (point.y - position.y) * vx) / magnitude;
        return projection >= 0 && perpendicular <= 28;
      }).slice(0, 2 + tower.level).forEach((target) => damageEnemy(target, level.damage, 14 + tower.level * 4));
    }
    event = {
      id: state.nextEventId,
      type: "shot",
      x: position.x,
      y: position.y,
      color: TOWER_DEFINITIONS[tower.type].color,
      label: tower.type,
    };
    return { ...tower, cooldownMs };
  });
  const next = { ...state, towers, enemies, event, nextEventId: event === state.event ? state.nextEventId : state.nextEventId + 1 };
  return resolveKills(next, enemies);
};

const resolveAirstrike = (state: SiegeRun, deltaMs: number): SiegeRun => {
  const strike = state.skills.airstrike;
  if (!strike) return state;
  if (strike.remainingMs > deltaMs) {
    return { ...state, skills: { ...state.skills, airstrike: { ...strike, remainingMs: strike.remainingMs - deltaMs } } };
  }
  const enemies = state.enemies.map((enemy) => Math.abs(enemy.progress - strike.progress) <= 105
    ? { ...enemy, hp: enemy.hp - effectiveDamage(145, enemy.armor, 20) }
    : enemy);
  return resolveKills({
    ...state,
    enemies,
    skills: { ...state.skills, airstrike: null },
  }, enemies);
};

export const activateEmp = (state: SiegeRun): SiegeRun => {
  if (state.phase !== "playing" || state.skills.empCooldownMs > 0) return state;
  const enemies = state.enemies.map((enemy) => ({
    ...enemy,
    hp: enemy.hp - effectiveDamage(36, enemy.armor, 8),
    stunRemainingMs: Math.max(enemy.stunRemainingMs, enemy.type === "boss" ? 850 : 1800),
  }));
  return withEvent(resolveKills({
    ...state,
    enemies,
    skills: { ...state.skills, empCooldownMs: 24000 },
  }, enemies), { type: "skill", label: "EMP", color: "#45f0ff" });
};

export const activateOverclock = (state: SiegeRun): SiegeRun => {
  if (state.phase !== "playing" || state.skills.overclockCooldownMs > 0) return state;
  return withEvent({
    ...state,
    skills: { ...state.skills, overclockCooldownMs: 30000, overclockRemainingMs: 6500 },
  }, { type: "skill", label: "OVERCLOCK", color: "#ffca5c" });
};

export const queueAirstrike = (state: SiegeRun, routeProgress: number): SiegeRun => {
  if (state.phase !== "playing" || state.skills.airstrikeCooldownMs > 0 || state.skills.airstrike) return state;
  return withEvent({
    ...state,
    skills: {
      ...state.skills,
      airstrikeCooldownMs: 28000,
      airstrike: { progress: clamp(routeProgress, 0, routeLength()), remainingMs: 650 },
    },
  }, { type: "skill", label: "AIRSTRIKE", color: "#ff6f91" });
};

export const stepSiege = (state: SiegeRun, rawDeltaMs: number): SiegeRun => {
  if (state.phase !== "playing") return state;
  const deltaMs = clamp(rawDeltaMs, 0, 100);
  let next: SiegeRun = {
    ...state,
    waveElapsedMs: state.waveElapsedMs + deltaMs,
    event: null,
    skills: {
      ...state.skills,
      empCooldownMs: Math.max(0, state.skills.empCooldownMs - deltaMs),
      overclockCooldownMs: Math.max(0, state.skills.overclockCooldownMs - deltaMs),
      overclockRemainingMs: Math.max(0, state.skills.overclockRemainingMs - deltaMs),
      airstrikeCooldownMs: Math.max(0, state.skills.airstrikeCooldownMs - deltaMs),
    },
  };

  const ready = next.pendingSpawns.filter((spawn) => spawn.spawnAtMs <= next.waveElapsedMs);
  next = { ...next, pendingSpawns: next.pendingSpawns.filter((spawn) => spawn.spawnAtMs > next.waveElapsedMs) };
  for (const spawn of ready) next = spawnEnemy(next, spawn.type);

  next = {
    ...next,
    enemies: next.enemies.map((enemy) => {
      const stunRemainingMs = Math.max(0, enemy.stunRemainingMs - deltaMs);
      const slowRemainingMs = Math.max(0, enemy.slowRemainingMs - deltaMs);
      const speedScale = stunRemainingMs > 0 ? 0 : slowRemainingMs > 0 ? 0.55 : 1;
      return { ...enemy, stunRemainingMs, slowRemainingMs, progress: enemy.progress + enemy.speed * speedScale * deltaMs / 1000 };
    }),
  };

  const leaked = next.enemies.filter((enemy) => enemy.progress >= routeLength());
  if (leaked.length) {
    const health = Math.max(0, next.health - leaked.reduce((sum, enemy) => sum + enemy.threat, 0));
    next = withEvent({
      ...next,
      health,
      combo: 1,
      enemies: next.enemies.filter((enemy) => enemy.progress < routeLength()),
      phase: health <= 0 ? "gameover" : next.phase,
    }, { type: "leak", label: health <= 0 ? "GAMEOVER" : `-${next.health - health}` });
  }
  if (next.phase === "gameover") return next;

  next = fireTowers(next, deltaMs);
  next = resolveAirstrike(next, deltaMs);

  if (!next.pendingSpawns.length && !next.enemies.length) {
    if (next.wave === 12 && next.mode === "campaign") {
      return withEvent({
        ...next, phase: "victory", campaignComplete: true,
        score: next.score + 5000 + next.health * 100 + next.credits * 2,
      }, { type: "wave", label: "VICTORY" });
    }
    const definition = next.wave <= CAMPAIGN_WAVES.length ? CAMPAIGN_WAVES[next.wave - 1] : generateEndlessWave(next.wave, next.difficulty);
    return withEvent({
      ...next,
      phase: "planning",
      credits: next.credits + (definition?.bonus ?? 100),
      score: next.score + (definition?.bonus ?? 100) * 5 + next.health * 10,
    }, { type: "wave", label: "CLEARED" });
  }
  return next;
};
