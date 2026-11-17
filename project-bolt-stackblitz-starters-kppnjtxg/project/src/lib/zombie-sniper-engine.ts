export type SniperStatus = "ready" | "playing" | "over";
export type SniperHitPart = "head" | "body";
export type SniperShotResult =
  | "headshot"
  | "hit"
  | "miss"
  | "empty"
  | "inactive";

export type ZombieTarget = {
  id: number;
  x: number;
  z: number;
  direction: -1 | 1;
  speed: number;
  size: number;
};

export type ZombieSniperState = {
  status: SniperStatus;
  score: number;
  kills: number;
  wave: number;
  lives: number;
  ammo: number;
  maxAmmo: number;
  reloading: boolean;
  reloadRemainingMs: number;
  spawnRemainingMs: number;
  nextTargetId: number;
  targets: ZombieTarget[];
};

export type ZombieSniperShot = {
  state: ZombieSniperState;
  result: SniperShotResult;
};

const MAGAZINE_SIZE = 5;
const STARTING_LIVES = 3;
const EDGE_LIMIT = 9;

export function createZombieSniperState(): ZombieSniperState {
  return {
    status: "ready",
    score: 0,
    kills: 0,
    wave: 1,
    lives: STARTING_LIVES,
    ammo: MAGAZINE_SIZE,
    maxAmmo: MAGAZINE_SIZE,
    reloading: false,
    reloadRemainingMs: 0,
    spawnRemainingMs: 0,
    nextTargetId: 1,
    targets: [],
  };
}

export function startZombieSniperRun(): ZombieSniperState {
  return { ...createZombieSniperState(), status: "playing" };
}

function spawnTarget(state: ZombieSniperState): ZombieTarget {
  const direction: -1 | 1 = Math.random() < 0.5 ? 1 : -1;
  return {
    id: state.nextTargetId,
    x: direction === 1 ? -EDGE_LIMIT : EDGE_LIMIT,
    z: -11 - Math.random() * 8,
    direction,
    speed: 2.15 + Math.random() * 0.55 + (state.wave - 1) * 0.25,
    size: 0.88 + Math.random() * 0.18,
  };
}

function spawnInterval(wave: number): number {
  return Math.max(720, 2200 - (wave - 1) * 130);
}

export function advanceZombieSniperRun(
  state: ZombieSniperState,
  deltaMs: number,
): ZombieSniperState {
  if (state.status !== "playing") return state;

  const elapsed = Math.max(0, Math.min(deltaMs, 100));
  let targets = state.targets
    .map((target) => ({
      ...target,
      x: target.x + target.direction * target.speed * (elapsed / 1000),
    }));
  let lives = state.lives;
  const escaped = targets.filter(
    (target) => target.x < -EDGE_LIMIT || target.x > EDGE_LIMIT,
  ).length;
  if (escaped) {
    lives = Math.max(0, lives - escaped);
    targets = targets.filter(
      (target) => target.x >= -EDGE_LIMIT && target.x <= EDGE_LIMIT,
    );
  }
  if (lives === 0) {
    return {
      ...state,
      lives,
      targets,
      status: "over",
      reloading: false,
      reloadRemainingMs: 0,
    };
  }

  let ammo = state.ammo;
  let reloading = state.reloading;
  let reloadRemainingMs = state.reloadRemainingMs;
  if (reloading) {
    reloadRemainingMs = Math.max(0, reloadRemainingMs - elapsed);
    if (reloadRemainingMs === 0) {
      ammo = state.maxAmmo;
      reloading = false;
    }
  }

  let spawnRemainingMs = state.spawnRemainingMs - elapsed;
  let nextTargetId = state.nextTargetId;
  const maxTargets = Math.min(2 + Math.floor((state.wave - 1) / 2), 5);
  if (spawnRemainingMs <= 0 && targets.length < maxTargets) {
    const target = spawnTarget(state);
    targets = [...targets, target];
    nextTargetId += 1;
    spawnRemainingMs = spawnInterval(state.wave);
  } else if (spawnRemainingMs <= 0) {
    spawnRemainingMs = 250;
  }

  return {
    ...state,
    lives,
    ammo,
    reloading,
    reloadRemainingMs,
    spawnRemainingMs,
    nextTargetId,
    targets,
  };
}

export function shootZombieTarget(
  state: ZombieSniperState,
  targetId: number | null,
  part: SniperHitPart = "body",
): ZombieSniperShot {
  if (state.status !== "playing") return { state, result: "inactive" };
  if (state.reloading || state.ammo === 0) {
    return { state, result: "empty" };
  }

  const ammo = state.ammo - 1;
  const target = targetId === null ? undefined : state.targets.find((t) => t.id === targetId);
  if (!target) {
    return { state: { ...state, ammo }, result: "miss" };
  }

  const kills = state.kills + 1;
  const headshot = part === "head";
  const score = state.score + (headshot ? 250 : 100);
  return {
    state: {
      ...state,
      ammo,
      score,
      kills,
      wave: 1 + Math.floor(kills / 5),
      targets: state.targets.filter((item) => item.id !== target.id),
    },
    result: headshot ? "headshot" : "hit",
  };
}

export function requestZombieReload(
  state: ZombieSniperState,
): ZombieSniperState {
  if (
    state.status !== "playing" ||
    state.reloading ||
    state.ammo === state.maxAmmo
  ) {
    return state;
  }
  return { ...state, reloading: true, reloadRemainingMs: 950 };
}
