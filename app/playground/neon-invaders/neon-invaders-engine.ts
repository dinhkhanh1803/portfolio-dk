export const WORLD = { width: 900, height: 620 } as const;
export type Phase = "ready" | "playing" | "paused" | "gameover" | "victory";
export type PowerType = "shield" | "rapid" | "dual" | "bomb";
export type EnemyKind = "scout" | "striker" | "elite" | "boss";
export type Bullet = { id: number; x: number; y: number; vy: number; owner: "player" | "enemy" };
export type Enemy = { id: number; x: number; y: number; hp: number; maxHp: number; kind: EnemyKind };
export type PowerUp = { id: number; x: number; y: number; type: PowerType };
export type InvadersRun = {
  phase: Phase;
  wave: number;
  score: number;
  combo: number;
  bestCombo: number;
  player: {
    x: number;
    y: number;
    lives: number;
    shieldMs: number;
    rapidMs: number;
    dualMs: number;
    invulnerableMs: number;
    cooldownMs: number;
  };
  enemies: Enemy[];
  bullets: Bullet[];
  powerUps: PowerUp[];
  bombs: number;
  enemyDirection: -1 | 1;
  enemyShootMs: number;
  seed: number;
  nextId: number;
};

const stepRandom = (seed: number) => {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const spawnWave = (run: InvadersRun, wave: number): InvadersRun => {
  let nextId = run.nextId;
  if (wave === 5 || wave === 10) {
    const hp = wave === 10 ? 70 : 38;
    return {
      ...run,
      wave,
      nextId: nextId + 1,
      enemies: [{ id: nextId, x: WORLD.width / 2, y: 105, hp, maxHp: hp, kind: "boss" }],
      enemyDirection: 1,
      enemyShootMs: 900,
    };
  }
  const rows = Math.min(5, 2 + Math.floor((wave - 1) / 2));
  const columns = Math.min(9, 6 + Math.floor(wave / 3));
  const spacing = 72;
  const startX = (WORLD.width - (columns - 1) * spacing) / 2;
  const enemies: Enemy[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const kind: EnemyKind = row === 0 && wave >= 7 ? "elite" : row < 2 ? "striker" : "scout";
      const hp = kind === "elite" ? 3 : kind === "striker" && wave >= 4 ? 2 : 1;
      enemies.push({ id: nextId, x: startX + column * spacing, y: 80 + row * 55, hp, maxHp: hp, kind });
      nextId += 1;
    }
  }
  return { ...run, wave, enemies, nextId, enemyDirection: 1, enemyShootMs: Math.max(480, 1300 - wave * 75) };
};

export const createInvadersRun = (seed = Date.now()): InvadersRun => spawnWave({
  phase: "ready",
  wave: 1,
  score: 0,
  combo: 0,
  bestCombo: 0,
  player: { x: WORLD.width / 2, y: 570, lives: 3, shieldMs: 0, rapidMs: 0, dualMs: 0, invulnerableMs: 0, cooldownMs: 0 },
  enemies: [],
  bullets: [],
  powerUps: [],
  bombs: 1,
  enemyDirection: 1,
  enemyShootMs: 1000,
  seed: seed >>> 0,
  nextId: 1,
}, 1);

export const startRun = (run: InvadersRun): InvadersRun =>
  run.phase === "ready" ? { ...run, phase: "playing" } : run;
export const togglePause = (run: InvadersRun): InvadersRun =>
  run.phase === "playing" ? { ...run, phase: "paused" } : run.phase === "paused" ? { ...run, phase: "playing" } : run;
export const movePlayer = (run: InvadersRun, x: number): InvadersRun =>
  run.phase === "playing" ? { ...run, player: { ...run.player, x: clamp(x, 24, WORLD.width - 24) } } : run;

export const firePlayer = (run: InvadersRun): InvadersRun => {
  if (run.phase !== "playing" || run.player.cooldownMs > 0) return run;
  let nextId = run.nextId;
  const offsets = run.player.dualMs > 0 ? [-12, 12] : [0];
  const bullets = offsets.map((offset): Bullet => ({ id: nextId++, x: run.player.x + offset, y: run.player.y - 24, vy: -620, owner: "player" }));
  return {
    ...run,
    nextId,
    bullets: [...run.bullets, ...bullets],
    player: { ...run.player, cooldownMs: run.player.rapidMs > 0 ? 95 : 240 },
  };
};

export const triggerBomb = (run: InvadersRun): InvadersRun => {
  if (run.phase !== "playing" || run.bombs <= 0) return run;
  const enemies = run.enemies
    .map((enemy) => enemy.kind === "boss" ? { ...enemy, hp: enemy.hp - 10 } : { ...enemy, hp: 0 })
    .filter((enemy) => enemy.hp > 0);
  return { ...run, bombs: run.bombs - 1, enemies, bullets: run.bullets.filter((bullet) => bullet.owner === "player"), score: run.score + (run.enemies.length - enemies.length) * 60 };
};

const overlaps = (ax: number, ay: number, bx: number, by: number, radius = 24) =>
  Math.abs(ax - bx) < radius && Math.abs(ay - by) < radius;

const applyPower = (run: InvadersRun, type: PowerType): InvadersRun => {
  if (type === "bomb") return { ...run, bombs: Math.min(3, run.bombs + 1) };
  return { ...run, player: { ...run.player, [`${type}Ms`]: 8500 } };
};

export const tickInvaders = (run: InvadersRun, elapsedMs: number): InvadersRun => {
  if (run.phase !== "playing" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return run;
  const dt = Math.min(100, elapsedMs);
  let next: InvadersRun = {
    ...run,
    player: {
      ...run.player,
      cooldownMs: Math.max(0, run.player.cooldownMs - dt),
      shieldMs: Math.max(0, run.player.shieldMs - dt),
      rapidMs: Math.max(0, run.player.rapidMs - dt),
      dualMs: Math.max(0, run.player.dualMs - dt),
      invulnerableMs: Math.max(0, run.player.invulnerableMs - dt),
    },
    bullets: run.bullets.map((bullet) => ({ ...bullet, y: bullet.y + bullet.vy * dt / 1000 })).filter((bullet) => bullet.y > -30 && bullet.y < WORLD.height + 30),
    powerUps: run.powerUps.map((power) => ({ ...power, y: power.y + 105 * dt / 1000 })).filter((power) => power.y < WORLD.height + 20),
    enemyShootMs: run.enemyShootMs - dt,
  };

  const speed = next.enemies.some((enemy) => enemy.kind === "boss") ? 48 : 24 + next.wave * 5;
  let direction = next.enemyDirection;
  let shifted = next.enemies.map((enemy) => ({ ...enemy, x: enemy.x + speed * direction * dt / 1000 }));
  if (shifted.some((enemy) => enemy.x < 28 || enemy.x > WORLD.width - 28)) {
    direction = direction === 1 ? -1 : 1;
    shifted = next.enemies.map((enemy) => ({ ...enemy, x: clamp(enemy.x, 28, WORLD.width - 28), y: enemy.y + 16 }));
  }
  next = { ...next, enemies: shifted, enemyDirection: direction };

  const playerBullets = next.bullets.filter((bullet) => bullet.owner === "player");
  const hitBullets = new Set<number>();
  let enemies = next.enemies.map((enemy) => {
    const bullet = playerBullets.find((candidate) => !hitBullets.has(candidate.id) && overlaps(candidate.x, candidate.y, enemy.x, enemy.y, enemy.kind === "boss" ? 46 : 25));
    if (!bullet) return enemy;
    hitBullets.add(bullet.id);
    return { ...enemy, hp: enemy.hp - 1 };
  });
  const killed = enemies.filter((enemy) => enemy.hp <= 0);
  enemies = enemies.filter((enemy) => enemy.hp > 0);
  let seed = next.seed;
  let nextId = next.nextId;
  const powerUps = [...next.powerUps];
  killed.forEach((enemy) => {
    const random = stepRandom(seed); seed = random.seed;
    if (random.value < 0.18) {
      const types: PowerType[] = ["shield", "rapid", "dual", "bomb"];
      powerUps.push({ id: nextId++, x: enemy.x, y: enemy.y, type: types[Math.floor(random.value * types.length * 5) % types.length] });
    }
  });
  const combo = killed.length > 0 ? next.combo + killed.length : next.combo;
  next = {
    ...next,
    enemies,
    powerUps,
    seed,
    nextId,
    combo,
    bestCombo: Math.max(next.bestCombo, combo),
    score: next.score + killed.reduce((sum, enemy) => sum + (enemy.kind === "boss" ? 3000 : 80 + next.wave * 15) * Math.max(1, combo), 0),
    bullets: next.bullets.filter((bullet) => !hitBullets.has(bullet.id)),
  };

  if (next.enemyShootMs <= 0 && next.enemies.length > 0) {
    const random = stepRandom(next.seed);
    const shooter = next.enemies[Math.floor(random.value * next.enemies.length)];
    next = {
      ...next,
      seed: random.seed,
      nextId: next.nextId + 1,
      enemyShootMs: Math.max(300, 1200 - next.wave * 70),
      bullets: [...next.bullets, { id: next.nextId, x: shooter.x, y: shooter.y + 18, vy: 260 + next.wave * 18, owner: "enemy" }],
    };
  }

  const enemyHit = next.bullets.find((bullet) => bullet.owner === "enemy" && overlaps(bullet.x, bullet.y, next.player.x, next.player.y, 22));
  if (enemyHit && next.player.invulnerableMs <= 0) {
    const shielded = next.player.shieldMs > 0;
    const lives = shielded ? next.player.lives : next.player.lives - 1;
    next = {
      ...next,
      combo: 0,
      bullets: next.bullets.filter((bullet) => bullet.id !== enemyHit.id),
      player: { ...next.player, lives, shieldMs: 0, invulnerableMs: 1100 },
      phase: lives <= 0 ? "gameover" : next.phase,
    };
  }

  const collected = next.powerUps.filter((power) => overlaps(power.x, power.y, next.player.x, next.player.y, 28));
  next = { ...next, powerUps: next.powerUps.filter((power) => !collected.includes(power)) };
  collected.forEach((power) => { next = applyPower(next, power.type); });

  if (next.enemies.some((enemy) => enemy.y > next.player.y - 38)) return { ...next, phase: "gameover" };
  if (next.enemies.length === 0) {
    if (next.wave >= 10) return { ...next, phase: "victory" };
    return spawnWave({ ...next, bullets: [], powerUps: [], combo: 0, bombs: Math.min(3, next.bombs + (next.wave % 3 === 0 ? 1 : 0)) }, next.wave + 1);
  }
  return next;
};

