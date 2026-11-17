export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 420;
export const PLAYER_RADIUS = 12;

export type GearRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type GearSlot = "weapon" | "shell" | "module";
export type GearItem = {
  id: string;
  name: string;
  rarity: GearRarity;
  slot: GearSlot;
  power: number;
  attackBonus: number;
  healthBonus: number;
  guardBonus: number;
};

export type RoomBlocker = { x: number; y: number; width: number; height: number; kind: "pillar" | "console" | "crate" };
export type EnemyKind = "tracker" | "warden";
export type EnemySpawn = { kind: EnemyKind; x: number; y: number };
export type RoomDefinition = {
  name: string;
  signalNote: string;
  blockers: RoomBlocker[];
  enemies: EnemySpawn[];
};

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    name: "ENTRY GALLERY",
    signalNote: "The surveyor's beacon is still transmitting.",
    blockers: [
      { x: 220, y: 106, width: 46, height: 54, kind: "pillar" },
      { x: 220, y: 260, width: 46, height: 54, kind: "pillar" },
      { x: 424, y: 172, width: 72, height: 76, kind: "console" },
    ],
    enemies: [{ kind: "tracker", x: 538, y: 206 }],
  },
  {
    name: "SERVICE SPINE",
    signalNote: "A second voice cuts through the static.",
    blockers: [
      { x: 252, y: 92, width: 92, height: 48, kind: "crate" },
      { x: 252, y: 282, width: 92, height: 48, kind: "crate" },
      { x: 442, y: 180, width: 50, height: 64, kind: "console" },
    ],
    enemies: [
      { kind: "tracker", x: 472, y: 126 },
      { kind: "tracker", x: 526, y: 288 },
      { kind: "warden", x: 602, y: 204 },
    ],
  },
  {
    name: "SIGNAL VAULT",
    signalNote: "The signal is coming from inside the buried structure.",
    blockers: [
      { x: 250, y: 126, width: 60, height: 60, kind: "pillar" },
      { x: 250, y: 236, width: 60, height: 60, kind: "pillar" },
      { x: 402, y: 112, width: 70, height: 46, kind: "console" },
      { x: 402, y: 264, width: 70, height: 46, kind: "console" },
    ],
    enemies: [
      { kind: "tracker", x: 470, y: 116 },
      { kind: "tracker", x: 480, y: 308 },
      { kind: "warden", x: 604, y: 208 },
    ],
  },
];

export type RunStatus = "briefing" | "playing" | "safe-room" | "escaped" | "defeated";
export type PlayerInput = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  attack: boolean;
  guard: boolean;
  dodge: boolean;
  interact: boolean;
};

export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  windupMs: number;
  attackCooldownMs: number;
  stunMs: number;
  facingX: number;
  facingY: number;
};

export type LootPickup = { id: number; x: number; y: number; item: GearItem };
export type EquippedGear = Partial<Record<GearSlot, GearItem>>;

export type DeepSignalRun = {
  status: RunStatus;
  roomIndex: number;
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    facingX: number;
    facingY: number;
    attackCooldownMs: number;
    attackMs: number;
    dodgeCooldownMs: number;
    dodgeMs: number;
    invulnerableMs: number;
    guarding: boolean;
  };
  enemies: Enemy[];
  pickups: LootPickup[];
  carriedGear: GearItem[];
  bankedGear: GearItem[];
  equippedGear: EquippedGear;
  kills: number;
  score: number;
  damageBlocked: number;
  roomCleared: boolean;
  lostGearCount: number;
  message: string;
  dodgeWasDown: boolean;
  interactWasDown: boolean;
};

const RARITY_RANK: Record<GearRarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

const RARITY_WEIGHTS: Array<[GearRarity, number]> = [
  ["Common", 55],
  ["Uncommon", 26],
  ["Rare", 12],
  ["Epic", 5.5],
  ["Legendary", 1.5],
];

const ITEM_NAMES: Record<GearSlot, string[]> = {
  weapon: ["Survey Cutter", "Pulse Edge", "Carbide Blade"],
  shell: ["Composite Shell", "Pressure Vest", "Impact Liner"],
  module: ["Relay Cell", "Field Capacitor", "Stability Core"],
};

const ENEMY_STATS: Record<EnemyKind, { health: number; speed: number }> = {
  tracker: { health: 46, speed: 74 },
  warden: { health: 92, speed: 48 },
};

let nextGearId = 1;

function createEnemies(roomIndex: number): Enemy[] {
  const room = ROOM_DEFINITIONS[roomIndex];
  return room.enemies.map((spawn, index) => {
    const stats = ENEMY_STATS[spawn.kind];
    return {
      id: roomIndex * 100 + index + 1,
      kind: spawn.kind,
      x: spawn.x,
      y: spawn.y,
      health: stats.health,
      maxHealth: stats.health,
      speed: stats.speed,
      windupMs: 0,
      attackCooldownMs: 300 + index * 180,
      stunMs: 0,
      facingX: -1,
      facingY: 0,
    };
  });
}

function bestGear(items: GearItem[]): EquippedGear {
  const equipped: EquippedGear = {};
  for (const item of items) {
    const current = equipped[item.slot];
    if (!current || item.power > current.power) equipped[item.slot] = item;
  }
  return equipped;
}

function makePlayer(equipped: EquippedGear) {
  const maxHealth = 100 + (equipped.shell?.healthBonus ?? 0);
  const maxStamina = 100 + (equipped.module?.guardBonus ?? 0);
  return {
    x: 82,
    y: WORLD_HEIGHT / 2,
    health: maxHealth,
    maxHealth,
    stamina: maxStamina,
    maxStamina,
    facingX: 1,
    facingY: 0,
    attackCooldownMs: 0,
    attackMs: 0,
    dodgeCooldownMs: 0,
    dodgeMs: 0,
    invulnerableMs: 0,
    guarding: false,
  };
}

export function createDeepSignalRun(bankedGear: GearItem[] = []): DeepSignalRun {
  const safeBank = bankedGear.filter((item) => item && item.id && item.name && item.rarity in RARITY_RANK);
  const equippedGear = bestGear(safeBank);
  return {
    status: "briefing",
    roomIndex: 0,
    player: makePlayer(equippedGear),
    enemies: createEnemies(0),
    pickups: [],
    carriedGear: [],
    bankedGear: safeBank,
    equippedGear,
    kills: 0,
    score: 0,
    damageBlocked: 0,
    roomCleared: false,
    lostGearCount: 0,
    message: "Follow the signal. The entrance has sealed.",
    dodgeWasDown: false,
    interactWasDown: false,
  };
}

export function startDeepSignalRun(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "briefing" && state.status !== "escaped" && state.status !== "defeated") return state;
  const next = createDeepSignalRun(state.bankedGear);
  return { ...next, status: "playing", message: "Find the relay. Watch the signal." };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function collidesWithBlocker(x: number, y: number, roomIndex: number) {
  const room = ROOM_DEFINITIONS[roomIndex];
  return room.blockers.some((blocker) => (
    x + PLAYER_RADIUS > blocker.x &&
    x - PLAYER_RADIUS < blocker.x + blocker.width &&
    y + PLAYER_RADIUS > blocker.y &&
    y - PLAYER_RADIUS < blocker.y + blocker.height
  ));
}

function moveCharacter(x: number, y: number, dx: number, dy: number, roomIndex: number) {
  let nextX = clamp(x + dx, 28, WORLD_WIDTH - 28);
  if (collidesWithBlocker(nextX, y, roomIndex)) nextX = x;
  let nextY = clamp(y + dy, 28, WORLD_HEIGHT - 28);
  if (collidesWithBlocker(nextX, nextY, roomIndex)) nextY = y;
  return { x: nextX, y: nextY };
}

function rollRarity(): GearRarity {
  let roll = Math.random() * 100;
  for (const [rarity, weight] of RARITY_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return "Common";
}

function makeGear(): GearItem {
  const slotOptions: GearSlot[] = ["weapon", "shell", "module"];
  const slot = slotOptions[Math.floor(Math.random() * slotOptions.length)];
  const rarity = rollRarity();
  const power = RARITY_RANK[rarity];
  const names = ITEM_NAMES[slot];
  const name = names[Math.floor(Math.random() * names.length)];
  return {
    id: `gear-${nextGearId++}`,
    name,
    rarity,
    slot,
    power,
    attackBonus: slot === "weapon" ? power * 5 : 0,
    healthBonus: slot === "shell" ? power * 8 : 0,
    guardBonus: slot === "module" ? power * 12 : 0,
  };
}

function normalized(x: number, y: number, fallbackX = 1, fallbackY = 0) {
  const length = Math.hypot(x, y);
  if (length < 0.001) return { x: fallbackX, y: fallbackY };
  return { x: x / length, y: y / length };
}

export function stepDeepSignalRun(state: DeepSignalRun, input: PlayerInput, deltaMs: number): DeepSignalRun {
  if (state.status !== "playing") return state;
  const dt = clamp(deltaMs, 0, 50);
  const seconds = dt / 1000;
  const player = { ...state.player };
  let enemies = state.enemies.map((enemy) => ({ ...enemy }));
  let pickups = [...state.pickups];
  let carriedGear = [...state.carriedGear];
  let bankedGear = [...state.bankedGear];
  let equippedGear = { ...state.equippedGear };
  let score = state.score;
  let kills = state.kills;
  let damageBlocked = state.damageBlocked;
  let roomCleared = state.roomCleared;
  let lostGearCount = state.lostGearCount;
  let status: RunStatus = state.status;
  let message = state.message;

  player.attackCooldownMs = Math.max(0, player.attackCooldownMs - dt);
  player.attackMs = Math.max(0, player.attackMs - dt);
  player.dodgeCooldownMs = Math.max(0, player.dodgeCooldownMs - dt);
  player.dodgeMs = Math.max(0, player.dodgeMs - dt);
  player.invulnerableMs = Math.max(0, player.invulnerableMs - dt);

  const look = normalized(input.lookX, input.lookY, player.facingX, player.facingY);
  const movement = normalized(input.moveX, input.moveY, 0, 0);
  if (Math.hypot(input.lookX, input.lookY) > 0.1) {
    player.facingX = look.x;
    player.facingY = look.y;
  } else if (Math.hypot(input.moveX, input.moveY) > 0.1 && !input.guard) {
    player.facingX = movement.x;
    player.facingY = movement.y;
  }

  if (input.dodge && !state.dodgeWasDown && player.dodgeCooldownMs <= 0) {
    const dodgeDirection = Math.hypot(input.moveX, input.moveY) > 0.1 ? movement : { x: player.facingX, y: player.facingY };
    player.dodgeMs = 190;
    player.dodgeCooldownMs = 680;
    player.invulnerableMs = Math.max(player.invulnerableMs, 220);
    player.facingX = dodgeDirection.x;
    player.facingY = dodgeDirection.y;
    message = "EVADE";
  }

  const staminaDrain = input.guard ? 18 : -24;
  player.stamina = clamp(player.stamina - staminaDrain * seconds, 0, player.maxStamina);
  player.guarding = input.guard && player.stamina > 0;
  let moveSpeed = player.guarding ? 102 : 164;
  if (player.dodgeMs > 0) moveSpeed = 330;
  const nextPosition = moveCharacter(
    player.x,
    player.y,
    movement.x * moveSpeed * seconds,
    movement.y * moveSpeed * seconds,
    state.roomIndex,
  );
  player.x = nextPosition.x;
  player.y = nextPosition.y;

  if (input.attack && !player.guarding && player.attackCooldownMs <= 0) {
    player.attackCooldownMs = 360;
    player.attackMs = 210;
    const hitRange = 76;
    const direction = { x: player.facingX, y: player.facingY };
    enemies = enemies.map((enemy) => {
      const toEnemy = normalized(enemy.x - player.x, enemy.y - player.y);
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance > hitRange || direction.x * toEnemy.x + direction.y * toEnemy.y < 0.18) return enemy;
      const damage = 27 + (equippedGear.weapon?.attackBonus ?? 0);
      return {
        ...enemy,
        health: Math.max(0, enemy.health - damage),
        stunMs: 220,
        x: enemy.x + toEnemy.x * 10,
        y: enemy.y + toEnemy.y * 10,
      };
    });
    message = "CUTTER SWING";
  }

  enemies = enemies.map((enemy) => {
    if (enemy.health <= 0) return enemy;
    const updated = { ...enemy };
    updated.attackCooldownMs = Math.max(0, updated.attackCooldownMs - dt);
    updated.stunMs = Math.max(0, updated.stunMs - dt);
    const dx = player.x - updated.x;
    const dy = player.y - updated.y;
    const distance = Math.hypot(dx, dy);
    const towardPlayer = normalized(dx, dy, -1, 0);
    updated.facingX = towardPlayer.x;
    updated.facingY = towardPlayer.y;
    if (updated.stunMs > 0) return updated;
    if (updated.windupMs > 0) {
      updated.windupMs = Math.max(0, updated.windupMs - dt);
      if (updated.windupMs === 0 && distance < 60 && player.invulnerableMs <= 0) {
        const facingDot = player.facingX * towardPlayer.x + player.facingY * towardPlayer.y;
        if (player.guarding && player.stamina >= 14 && facingDot > 0.2) {
          player.stamina = Math.max(0, player.stamina - 14);
          damageBlocked += 16;
          message = "GUARD HELD";
        } else {
          player.health = Math.max(0, player.health - 16);
          player.invulnerableMs = 470;
          message = "HIT — RESET YOUR POSITION";
        }
        updated.attackCooldownMs = 780;
      }
      return updated;
    }
    if (distance > 52) {
      const moved = moveCharacter(updated.x, updated.y, towardPlayer.x * updated.speed * seconds, towardPlayer.y * updated.speed * seconds, state.roomIndex);
      updated.x = moved.x;
      updated.y = moved.y;
    } else if (updated.attackCooldownMs <= 0) {
      updated.windupMs = updated.kind === "warden" ? 700 : 520;
    }
    return updated;
  });

  const newDeaths = enemies.filter((enemy, index) => enemy.health <= 0 && state.enemies[index].health > 0);
  for (const enemy of newDeaths) {
    kills += 1;
    score += enemy.kind === "warden" ? 160 : 100;
    if (kills === 1 || Math.random() < 0.58) {
      pickups.push({ id: enemy.id * 1000 + kills, x: enemy.x, y: enemy.y, item: makeGear() });
    }
  }

  const collected: LootPickup[] = [];
  pickups = pickups.filter((pickup) => {
    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) > 28) return true;
    collected.push(pickup);
    return false;
  });
  for (const pickup of collected) {
    carriedGear.push(pickup.item);
    const current = equippedGear[pickup.item.slot];
    if (!current || pickup.item.power > current.power) equippedGear[pickup.item.slot] = pickup.item;
    if (pickup.item.slot === "shell" && pickup.item.power > (current?.power ?? 0)) {
      player.maxHealth = 100 + pickup.item.healthBonus;
      player.health = Math.min(player.maxHealth, player.health + pickup.item.healthBonus);
    }
    if (pickup.item.slot === "module" && pickup.item.power > (current?.power ?? 0)) {
      player.maxStamina = 100 + pickup.item.guardBonus;
      player.stamina = Math.min(player.maxStamina, player.stamina + pickup.item.guardBonus);
    }
    score += RARITY_RANK[pickup.item.rarity] * 25;
    message = `${pickup.item.rarity.toUpperCase()} · ${pickup.item.name}`;
  }

  if (player.health <= 0) {
    status = "defeated";
    lostGearCount = carriedGear.length;
    carriedGear = [];
    message = "RUN LOST — BANKED GEAR IS SAFE";
  } else if (!roomCleared && enemies.every((enemy) => enemy.health <= 0) && pickups.length === 0) {
    roomCleared = true;
    message = "AREA CLEAR — REACH THE RELAY DOOR";
  }

  const exitDistance = Math.hypot(WORLD_WIDTH - 62 - player.x, WORLD_HEIGHT / 2 - player.y);
  if (status === "playing" && roomCleared && input.interact && !state.interactWasDown && exitDistance < 76) {
    status = "safe-room";
    message = "RELAY SECURE — BANK YOUR HAUL OR PUSH DEEPER";
  }

  return {
    ...state,
    status,
    player,
    enemies,
    pickups,
    carriedGear,
    bankedGear,
    equippedGear,
    kills,
    score,
    damageBlocked,
    roomCleared,
    lostGearCount,
    message,
    dodgeWasDown: input.dodge,
    interactWasDown: input.interact,
  };
}

function loadNextRoom(state: DeepSignalRun): DeepSignalRun {
  const nextRoom = state.roomIndex + 1;
  if (nextRoom >= ROOM_DEFINITIONS.length) {
    return { ...state, status: "escaped", message: "SIGNAL REACHED — RUN COMPLETE" };
  }
  const player = {
    ...state.player,
    x: 82,
    y: WORLD_HEIGHT / 2,
    health: Math.min(state.player.maxHealth, state.player.health + 20),
    stamina: state.player.maxStamina,
    guarding: false,
    invulnerableMs: 300,
  };
  return {
    ...state,
    status: "playing",
    roomIndex: nextRoom,
    player,
    enemies: createEnemies(nextRoom),
    pickups: [],
    roomCleared: false,
    interactWasDown: false,
    message: ROOM_DEFINITIONS[nextRoom].signalNote,
  };
}

export function secureLootAndContinue(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room") return state;
  const secured = [...state.bankedGear, ...state.carriedGear];
  const next = { ...state, bankedGear: secured, carriedGear: [] };
  return loadNextRoom(next);
}

export function riskLootAndContinue(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room") return state;
  return loadNextRoom(state);
}

export function extractWithLoot(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room") return state;
  return {
    ...state,
    status: "escaped",
    bankedGear: [...state.bankedGear, ...state.carriedGear],
    carriedGear: [],
    message: "HAUL SECURED — SIGNAL RECEIVED",
  };
}
