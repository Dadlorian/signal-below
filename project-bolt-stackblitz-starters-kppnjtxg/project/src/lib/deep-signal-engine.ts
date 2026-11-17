export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 420;
export const PLAYER_RADIUS = 12;
export const FINAL_BOSS_FLOOR = 100;

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
export type EnemyKind = "tracker" | "warden" | "boss";
export type RoomDefinition = {
  name: string;
  signalNote: string;
  blockers: RoomBlocker[];
  isBossFloor: boolean;
  isFinalBoss: boolean;
};

export type RunStatus = "briefing" | "playing" | "safe-room" | "victory-ending" | "escaped" | "defeated";
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
  damage: number;
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
  currentRoom: RoomDefinition;
  overdriveMode: boolean;
  player: {
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    level: number;
    xp: number;
    xpToNext: number;
    bonusAttack: number;
    bonusSpeed: number;
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

const ITEM_NAMES: Record<GearSlot, string[]> = {
  weapon: ["Survey Cutter", "Pulse Edge", "Carbide Blade", "Plasma Cleaver", "Arc Ripper"],
  shell: ["Composite Shell", "Pressure Vest", "Impact Liner", "Aegis Plating", "Titan Exo"],
  module: ["Relay Cell", "Field Capacitor", "Stability Core", "Overdrive Coil", "Quantum Matrix"],
};

const SECTOR_TITLES = [
  "ENTRY GALLERY",
  "SERVICE SPINE",
  "SIGNAL VAULT",
  "THERMAL CONDUIT",
  "RELAY ARCHIVE",
  "SUB-REACTOR",
  "CORE SHAFT",
  "ABYSSAL NODE",
];

let nextGearId = 1;

function generateProceduralRoom(roomIndex: number): RoomDefinition {
  const floor = roomIndex + 1;
  const isFinalBoss = floor === FINAL_BOSS_FLOOR;
  const isBossFloor = floor % 10 === 0;
  const blockerCount = isBossFloor ? 2 : 3 + (floor % 3);
  const blockers: RoomBlocker[] = [];
  const kinds: RoomBlocker["kind"][] = ["pillar", "crate", "console"];

  for (let i = 0; i < blockerCount; i++) {
    const width = 46 + Math.floor(Math.random() * 38);
    const height = 46 + Math.floor(Math.random() * 34);
    const bx = 180 + Math.floor(Math.random() * (WORLD_WIDTH - 340));
    let by = 56 + Math.floor(Math.random() * (WORLD_HEIGHT - 112 - height));
    if (Math.abs(by + height / 2 - WORLD_HEIGHT / 2) < 48 && (bx < 170 || bx > WORLD_WIDTH - 170)) {
      by = by < WORLD_HEIGHT / 2 ? 46 : WORLD_HEIGHT - 46 - height;
    }
    blockers.push({
      x: bx,
      y: by,
      width,
      height,
      kind: kinds[(floor + i) % kinds.length],
    });
  }

  const sectorName = isFinalBoss
    ? "THE SIGNAL CORE (FINAL)"
    : isBossFloor
      ? "GUARDIAN CHAMBER - F" + floor
      : SECTOR_TITLES[roomIndex % SECTOR_TITLES.length] + " - F" + floor;

  const signalNote = isFinalBoss
    ? "The source of the distress beacon stands before you."
    : isBossFloor
      ? "Heavy seismic readings detected ahead."
      : floor > FINAL_BOSS_FLOOR
        ? "OVERDRIVE: Uncharted signal harmonics beyond Floor 100."
        : "The signal pulses stronger the deeper you descend.";

  return {
    name: sectorName,
    signalNote,
    blockers,
    isBossFloor,
    isFinalBoss,
  };
}

function createEnemiesForRoom(roomIndex: number, room: RoomDefinition): Enemy[] {
  const floor = roomIndex + 1;
  const scale = 1 + (floor - 1) * 0.14;
  const enemies: Enemy[] = [];

  if (room.isBossFloor) {
    const bossHp = Math.round((room.isFinalBoss ? 650 : 260) * scale);
    enemies.push({
      id: floor * 1000 + 1,
      kind: "boss",
      x: WORLD_WIDTH - 165,
      y: WORLD_HEIGHT / 2,
      health: bossHp,
      maxHealth: bossHp,
      speed: Math.min(95, 52 + floor * 0.35),
      damage: Math.round((room.isFinalBoss ? 34 : 24) * (1 + (floor - 1) * 0.06)),
      windupMs: 0,
      attackCooldownMs: 600,
      stunMs: 0,
      facingX: -1,
      facingY: 0,
    });
  }

  const mobCount = room.isBossFloor
    ? Math.min(3, 1 + Math.floor(floor / 30))
    : Math.min(8, 2 + Math.floor(floor / 4) + (floor % 3));

  for (let i = 0; i < mobCount; i++) {
    const isWarden = floor >= 3 && (i % 3 === 2 || Math.random() < Math.min(0.45, floor * 0.01));
    const kind: EnemyKind = isWarden ? "warden" : "tracker";
    const baseHp = kind === "warden" ? 88 : 44;
    const hp = Math.round(baseHp * scale);
    const spawnX = 320 + Math.floor(Math.random() * (WORLD_WIDTH - 420));
    const spawnY = 55 + Math.floor(Math.random() * (WORLD_HEIGHT - 110));
    enemies.push({
      id: floor * 1000 + i + 10,
      kind,
      x: spawnX,
      y: spawnY,
      health: hp,
      maxHealth: hp,
      speed: Math.min(135, (kind === "warden" ? 50 : 76) + floor * 0.4),
      damage: Math.round((kind === "warden" ? 18 : 13) * (1 + (floor - 1) * 0.05)),
      windupMs: 0,
      attackCooldownMs: 250 + i * 160,
      stunMs: 0,
      facingX: -1,
      facingY: 0,
    });
  }

  return enemies;
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
  const maxHealth = 110 + (equipped.shell?.healthBonus ?? 0);
  const maxStamina = 100 + (equipped.module?.guardBonus ?? 0);
  return {
    x: 78,
    y: WORLD_HEIGHT / 2,
    health: maxHealth,
    maxHealth,
    stamina: maxStamina,
    maxStamina,
    level: 1,
    xp: 0,
    xpToNext: 100,
    bonusAttack: 0,
    bonusSpeed: 0,
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
  const firstRoom = generateProceduralRoom(0);
  return {
    status: "briefing",
    roomIndex: 0,
    currentRoom: firstRoom,
    overdriveMode: false,
    player: makePlayer(equippedGear),
    enemies: createEnemiesForRoom(0, firstRoom),
    pickups: [],
    carriedGear: [],
    bankedGear: safeBank,
    equippedGear,
    kills: 0,
    score: 0,
    damageBlocked: 0,
    roomCleared: false,
    lostGearCount: 0,
    message: "100 floors below. Clear enemies to ascend deeper.",
    dodgeWasDown: false,
    interactWasDown: false,
  };
}

export function startDeepSignalRun(state: DeepSignalRun): DeepSignalRun {
  if (
    state.status !== "briefing" &&
    state.status !== "escaped" &&
    state.status !== "defeated" &&
    state.status !== "victory-ending"
  ) {
    return state;
  }
  const next = createDeepSignalRun(state.bankedGear);
  return { ...next, status: "playing", message: "FLOOR 01 - CLEAR ALL TARGETS TO ADVANCE" };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function collidesWithBlocker(x: number, y: number, room: RoomDefinition) {
  return room.blockers.some((blocker) => (
    x + PLAYER_RADIUS > blocker.x &&
    x - PLAYER_RADIUS < blocker.x + blocker.width &&
    y + PLAYER_RADIUS > blocker.y &&
    y - PLAYER_RADIUS < blocker.y + blocker.height
  ));
}

function moveCharacter(x: number, y: number, dx: number, dy: number, room: RoomDefinition) {
  let nextX = clamp(x + dx, 28, WORLD_WIDTH - 28);
  if (collidesWithBlocker(nextX, y, room)) nextX = x;
  let nextY = clamp(y + dy, 28, WORLD_HEIGHT - 28);
  if (collidesWithBlocker(nextX, nextY, room)) nextY = y;
  return { x: nextX, y: nextY };
}

function rollRarity(floor: number): GearRarity {
  const bonus = Math.min(35, floor * 0.45);
  const roll = Math.random() * 100 + bonus;
  if (roll > 118) return "Legendary";
  if (roll > 98) return "Epic";
  if (roll > 76) return "Rare";
  if (roll > 48) return "Uncommon";
  return "Common";
}

function makeGear(floor: number, guaranteedRarity?: GearRarity): GearItem {
  const slotOptions: GearSlot[] = ["weapon", "shell", "module"];
  const slot = slotOptions[Math.floor(Math.random() * slotOptions.length)];
  const rarity = guaranteedRarity ?? rollRarity(floor);
  const rank = RARITY_RANK[rarity];
  const floorBoost = Math.floor((floor - 1) / 3);
  const power = rank * 3 + floorBoost;
  const names = ITEM_NAMES[slot];
  const name = names[Math.min(names.length - 1, rank - 1)] + " +" + floor;
  return {
    id: "gear-" + nextGearId++,
    name,
    rarity,
    slot,
    power,
    attackBonus: slot === "weapon" ? power * 4 : 0,
    healthBonus: slot === "shell" ? power * 10 : 0,
    guardBonus: slot === "module" ? power * 10 : 0,
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
  const floor = state.roomIndex + 1;
  const player = { ...state.player };
  let enemies = state.enemies.map((enemy) => ({ ...enemy }));
  let pickups = [...state.pickups];
  let carriedGear = [...state.carriedGear];
  const bankedGear = [...state.bankedGear];
  const equippedGear = { ...state.equippedGear };
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
    player.dodgeCooldownMs = 620;
    player.invulnerableMs = Math.max(player.invulnerableMs, 240);
    player.facingX = dodgeDirection.x;
    player.facingY = dodgeDirection.y;
    message = "EVADE";
  }

  const staminaDrain = input.guard ? 16 : -28;
  player.stamina = clamp(player.stamina - staminaDrain * seconds, 0, player.maxStamina);
  player.guarding = input.guard && player.stamina > 0;
  let moveSpeed = (player.guarding ? 110 : 178) + player.bonusSpeed;
  if (player.dodgeMs > 0) moveSpeed = 350 + player.bonusSpeed;
  const nextPosition = moveCharacter(
    player.x,
    player.y,
    movement.x * moveSpeed * seconds,
    movement.y * moveSpeed * seconds,
    state.currentRoom,
  );
  player.x = nextPosition.x;
  player.y = nextPosition.y;

  if (input.attack && !player.guarding && player.attackCooldownMs <= 0) {
    player.attackCooldownMs = Math.max(180, 330 - player.level * 4);
    player.attackMs = 200;
    const hitRange = 84;
    const direction = { x: player.facingX, y: player.facingY };
    const totalAttack = 30 + player.bonusAttack + (equippedGear.weapon?.attackBonus ?? 0);
    enemies = enemies.map((enemy) => {
      const toEnemy = normalized(enemy.x - player.x, enemy.y - player.y);
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      const reach = enemy.kind === "boss" ? hitRange + 22 : hitRange;
      if (distance > reach || direction.x * toEnemy.x + direction.y * toEnemy.y < 0.15) return enemy;
      const knockback = enemy.kind === "boss" ? 4 : 12;
      return {
        ...enemy,
        health: Math.max(0, enemy.health - totalAttack),
        stunMs: enemy.kind === "boss" ? 90 : 210,
        x: clamp(enemy.x + toEnemy.x * knockback, 32, WORLD_WIDTH - 32),
        y: clamp(enemy.y + toEnemy.y * knockback, 32, WORLD_HEIGHT - 32),
      };
    });
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

    const attackReach = updated.kind === "boss" ? 76 : 58;
    if (updated.windupMs > 0) {
      updated.windupMs = Math.max(0, updated.windupMs - dt);
      if (updated.windupMs === 0 && distance < attackReach && player.invulnerableMs <= 0) {
        const facingDot = player.facingX * towardPlayer.x + player.facingY * towardPlayer.y;
        if (player.guarding && player.stamina >= 12 && facingDot > 0.15) {
          player.stamina = Math.max(0, player.stamina - 12);
          damageBlocked += updated.damage;
          message = "GUARD HELD";
        } else {
          player.health = Math.max(0, player.health - updated.damage);
          player.invulnerableMs = 450;
          message = updated.kind === "boss" ? "BOSS IMPACT!" : "HIT - REPOSITION";
        }
        updated.attackCooldownMs = updated.kind === "boss" ? 680 : 740;
      }
      return updated;
    }

    const stopDist = updated.kind === "boss" ? 64 : 48;
    if (distance > stopDist) {
      const moved = moveCharacter(
        updated.x,
        updated.y,
        towardPlayer.x * updated.speed * seconds,
        towardPlayer.y * updated.speed * seconds,
        state.currentRoom,
      );
      updated.x = moved.x;
      updated.y = moved.y;
    } else if (updated.attackCooldownMs <= 0) {
      updated.windupMs = updated.kind === "boss" ? 640 : updated.kind === "warden" ? 660 : 490;
    }
    return updated;
  });

  const newDeaths = enemies.filter((enemy, index) => enemy.health <= 0 && state.enemies[index].health > 0);
  for (const enemy of newDeaths) {
    kills += 1;
    const xpGain = enemy.kind === "boss" ? 180 + floor * 12 : enemy.kind === "warden" ? 55 + floor * 3 : 35 + floor * 2;
    score += enemy.kind === "boss" ? 500 + floor * 20 : enemy.kind === "warden" ? 160 : 100;
    player.xp += xpGain;

    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.xpToNext = Math.round(player.xpToNext * 1.22);
      player.maxHealth += 16;
      player.health = player.maxHealth;
      player.maxStamina += 8;
      player.stamina = player.maxStamina;
      player.bonusAttack += 6;
      player.bonusSpeed = Math.min(90, player.bonusSpeed + 3);
      message = "LEVEL UP! LV." + player.level + " - ATK & HP BOOSTED";
    }

    if (enemy.kind === "boss" || kills === 1 || Math.random() < 0.65) {
      const loot = enemy.kind === "boss" ? makeGear(floor, floor >= 50 ? "Legendary" : "Epic") : makeGear(floor);
      pickups.push({ id: enemy.id * 1000 + kills, x: enemy.x, y: enemy.y, item: loot });
    }
  }

  const collected: LootPickup[] = [];
  pickups = pickups.filter((pickup) => {
    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) > 36) return true;
    collected.push(pickup);
    return false;
  });
  for (const pickup of collected) {
    carriedGear.push(pickup.item);
    const current = equippedGear[pickup.item.slot];
    if (!current || pickup.item.power > current.power) {
      equippedGear[pickup.item.slot] = pickup.item;
      if (pickup.item.slot === "shell") {
        player.maxHealth = 110 + (player.level - 1) * 16 + pickup.item.healthBonus;
        player.health = Math.min(player.maxHealth, player.health + 25);
      }
      if (pickup.item.slot === "module") {
        player.maxStamina = 100 + (player.level - 1) * 8 + pickup.item.guardBonus;
        player.stamina = player.maxStamina;
      }
      message = "AUTO-EQUIPPED: " + pickup.item.name + " (" + pickup.item.rarity + ")";
    } else {
      message = "LOOTED: " + pickup.item.name;
    }
    score += RARITY_RANK[pickup.item.rarity] * 30;
  }

  if (player.health <= 0) {
    status = "defeated";
    lostGearCount = carriedGear.length;
    carriedGear = [];
    message = "FALLEN ON FLOOR " + floor + " - BANKED GEAR IS SAFE";
  } else if (!roomCleared && enemies.every((enemy) => enemy.health <= 0)) {
    for (const pickup of pickups) {
      carriedGear.push(pickup.item);
      const current = equippedGear[pickup.item.slot];
      if (!current || pickup.item.power > current.power) {
        equippedGear[pickup.item.slot] = pickup.item;
        if (pickup.item.slot === "shell") {
          player.maxHealth = 110 + (player.level - 1) * 16 + pickup.item.healthBonus;
          player.health = Math.min(player.maxHealth, player.health + 25);
        }
        if (pickup.item.slot === "module") {
          player.maxStamina = 100 + (player.level - 1) * 8 + pickup.item.guardBonus;
          player.stamina = player.maxStamina;
        }
      }
      score += RARITY_RANK[pickup.item.rarity] * 30;
    }
    pickups = [];
    roomCleared = true;

    if (state.currentRoom.isFinalBoss && !state.overdriveMode) {
      status = "victory-ending";
      message = "FLOOR 100 SOVEREIGN DEFEATED - SIGNAL DECODED!";
    } else {
      message = "FLOOR " + floor + " CLEAR - STEP TO THE RELAY DOOR TO ADVANCE";
    }
  }

  const exitDistance = Math.hypot(WORLD_WIDTH - 62 - player.x, WORLD_HEIGHT / 2 - player.y);
  if (status === "playing" && roomCleared && exitDistance < 76) {
    if (floor % 5 === 0) {
      status = "safe-room";
      message = "RELAY CHECKPOINT (FLOOR " + floor + ") - BANK LOOT OR PUSH DEEPER";
    } else {
      return advanceToFloor({
        ...state,
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
      }, state.roomIndex + 1);
    }
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

function advanceToFloor(state: DeepSignalRun, nextRoomIndex: number): DeepSignalRun {
  const nextRoom = generateProceduralRoom(nextRoomIndex);
  const nextFloor = nextRoomIndex + 1;
  const player = {
    ...state.player,
    x: 78,
    y: WORLD_HEIGHT / 2,
    health: Math.min(state.player.maxHealth, state.player.health + Math.round(state.player.maxHealth * 0.25)),
    stamina: state.player.maxStamina,
    guarding: false,
    invulnerableMs: 350,
  };
  return {
    ...state,
    status: "playing",
    roomIndex: nextRoomIndex,
    currentRoom: nextRoom,
    player,
    enemies: createEnemiesForRoom(nextRoomIndex, nextRoom),
    pickups: [],
    roomCleared: false,
    interactWasDown: false,
    message: nextRoom.isFinalBoss
      ? "FLOOR 100 - DEFEAT THE SIGNAL SOVEREIGN!"
      : nextRoom.isBossFloor
        ? "FLOOR " + nextFloor + " BOSS - " + nextRoom.name
        : "FLOOR " + nextFloor + " - " + nextRoom.name,
  };
}

export function secureLootAndContinue(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room") return state;
  const secured = [...state.bankedGear, ...state.carriedGear];
  return advanceToFloor({ ...state, bankedGear: secured, carriedGear: [] }, state.roomIndex + 1);
}

export function riskLootAndContinue(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room") return state;
  return advanceToFloor(state, state.roomIndex + 1);
}

export function continueOverdriveAfterEnding(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "victory-ending") return state;
  const secured = [...state.bankedGear, ...state.carriedGear];
  return advanceToFloor(
    { ...state, bankedGear: secured, carriedGear: [], overdriveMode: true },
    state.roomIndex + 1,
  );
}

export function extractWithLoot(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "safe-room" && state.status !== "victory-ending") return state;
  return {
    ...state,
    status: "escaped",
    bankedGear: [...state.bankedGear, ...state.carriedGear],
    carriedGear: [],
    message: "EXPEDITION COMPLETE - ALL GEAR SECURED",
  };
}
