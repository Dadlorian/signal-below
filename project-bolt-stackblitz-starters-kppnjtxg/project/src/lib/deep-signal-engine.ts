import {
  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  MAX_INVENTORY_SLOTS,
  MAX_SLOT_UPGRADE_LEVEL,
  MAX_STACK_SIZE,
  VAULT_PAGE_SIZE,
  VAULT_TOTAL_PAGES,
  createDefaultSurveyorProfile,
  stackGearList,
  type EquippedGearMap,
  type GearItem,
  type GearRarity,
  type GearSlot,
  type SlotUpgradeMap,
  type SurveyorProfile,
  type SurveyorStats,
  type WeaponArchetype,
} from "./deep-signal-store";

export type {
  EquippedGearMap,
  GearItem,
  GearRarity,
  GearSlot,
  SlotUpgradeMap,
  SurveyorProfile,
  SurveyorStats,
  WeaponArchetype,
};
export {
  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  MAX_INVENTORY_SLOTS,
  MAX_SLOT_UPGRADE_LEVEL,
  MAX_STACK_SIZE,
  VAULT_PAGE_SIZE,
  VAULT_TOTAL_PAGES,
};

export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 420;
export const PLAYER_RADIUS = 12;
export const FINAL_BOSS_FLOOR = 100;

export type BiomeId =
  | "outer-bunker"
  | "coolant-conduits"
  | "relay-archives"
  | "thermal-abyss"
  | "signal-core";

export type BiomeDefinition = {
  id: BiomeId;
  name: string;
  floorRangeLabel: string;
  minFloor: number;
  maxFloor: number;
  floorColor: string;
  gridColor: string;
  wallColor: string;
  trimColor: string;
  accentColor: string;
  voidTopColor: string;
  voidBottomColor: string;
  ambientNote: string;
};

export const BIOMES: BiomeDefinition[] = [
  {
    id: "outer-bunker",
    name: "OUTER BUNKER",
    floorRangeLabel: "FLOORS 01–20",
    minFloor: 1,
    maxFloor: 20,
    floorColor: "#1f2a26",
    gridColor: "#2c3b35",
    wallColor: "#2b3833",
    trimColor: "#536b61",
    accentColor: "#6fe3c1",
    voidTopColor: "#0a110f",
    voidBottomColor: "#14201c",
    ambientNote: "Collapsed concrete blast doors, rusted catwalks & dead beacons.",
  },
  {
    id: "coolant-conduits",
    name: "COOLANT CONDUITS",
    floorRangeLabel: "FLOORS 21–40",
    minFloor: 21,
    maxFloor: 40,
    floorColor: "#152533",
    gridColor: "#21384a",
    wallColor: "#1f3445",
    trimColor: "#4f7a9c",
    accentColor: "#63d2ff",
    voidTopColor: "#071017",
    voidBottomColor: "#0f1e2b",
    ambientNote: "Fractured cryo-pipes leak frozen mist across corroded grates.",
  },
  {
    id: "relay-archives",
    name: "RELAY ARCHIVES",
    floorRangeLabel: "FLOORS 41–60",
    minFloor: 41,
    maxFloor: 60,
    floorColor: "#201d33",
    gridColor: "#2f2b4a",
    wallColor: "#2c2745",
    trimColor: "#69619c",
    accentColor: "#b69cff",
    voidTopColor: "#0b0917",
    voidBottomColor: "#171329",
    ambientNote: "Abandoned tape vaults and tangled fiber trunks hum in the dark.",
  },
  {
    id: "thermal-abyss",
    name: "THERMAL ABYSS",
    floorRangeLabel: "FLOORS 61–80",
    minFloor: 61,
    maxFloor: 80,
    floorColor: "#2c1a15",
    gridColor: "#422720",
    wallColor: "#3b211a",
    trimColor: "#8a4a39",
    accentColor: "#ff8c5a",
    voidTopColor: "#120705",
    voidBottomColor: "#21100b",
    ambientNote: "Cracked basalt catwalks suspended over geothermal fissures.",
  },
  {
    id: "signal-core",
    name: "THE SIGNAL CORE",
    floorRangeLabel: "FLOORS 81–100+",
    minFloor: 81,
    maxFloor: 999,
    floorColor: "#1a1626",
    gridColor: "#2c2540",
    wallColor: "#261f38",
    trimColor: "#855eb5",
    accentColor: "#f5d469",
    voidTopColor: "#07050e",
    voidBottomColor: "#140e24",
    ambientNote: "Shattered monolith rings orbit the origin carrier frequency.",
  },
];

export function getBiomeForFloor(floor: number): BiomeDefinition {
  if (floor <= 20) return BIOMES.at(0)!;
  if (floor <= 40) return BIOMES.at(1)!;
  if (floor <= 60) return BIOMES.at(2)!;
  if (floor <= 80) return BIOMES.at(3)!;
  return BIOMES.at(4)!;
}

export type BossArchetypeId =
  | "warden-10"
  | "bulkhead-20"
  | "cryo-30"
  | "cryo-40"
  | "archivist-50"
  | "phantom-60"
  | "pyre-70"
  | "magma-80"
  | "monolith-90"
  | "sovereign-100"
  | "overdrive-apex";

export type BossSpec = {
  archetype: BossArchetypeId;
  name: string;
  title: string;
  abilityLabel: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  threatTier: number;
};

export function getBossSpecForFloor(floor: number): BossSpec {
  if (floor === 10) return { archetype: "warden-10", name: "VANCE-01 // IRON WARDEN", title: "PERIMETER LOCKDOWN ENFORCER", abilityLabel: "SEISMIC SHOCKWAVE", primaryColor: "#b85d43", secondaryColor: "#422118", glowColor: "#ffb36b", threatTier: 1 };
  if (floor === 20) return { archetype: "bulkhead-20", name: "DREADNOUGHT K-20", title: "BUNKER CORE JUGGERNAUT", abilityLabel: "SHRAPNEL BARRAGE", primaryColor: "#cf4e38", secondaryColor: "#381510", glowColor: "#ffcf56", threatTier: 2 };
  if (floor === 30) return { archetype: "cryo-30", name: "CRYO-MATRIARCH VEX", title: "CONDUIT FREEZE REGULATOR", abilityLabel: "CRYO NOVA SPIRAL", primaryColor: "#3898d9", secondaryColor: "#11304a", glowColor: "#9ef0ff", threatTier: 3 };
  if (floor === 40) return { archetype: "cryo-40", name: "GLACIAL LEVIATHAN", title: "DEEP COOLANT SENTINEL", abilityLabel: "ABSOLUTE ZERO NOVA", primaryColor: "#2d7ec7", secondaryColor: "#0c2238", glowColor: "#79f2cc", threatTier: 4 };
  if (floor === 50) return { archetype: "archivist-50", name: "ARCHIVIST NULL", title: "TAPE VAULT CURATOR", abilityLabel: "PHASE BLINK & VOLLEY", primaryColor: "#8f5ce6", secondaryColor: "#271645", glowColor: "#eabfff", threatTier: 5 };
  if (floor === 60) return { archetype: "phantom-60", name: "ECHO SERAPH", title: "HARMONIC RESONANCE WEAVER", abilityLabel: "CARRIER CROSS-BEAM", primaryColor: "#a84ce6", secondaryColor: "#2c1140", glowColor: "#ff9ef5", threatTier: 6 };
  if (floor === 70) return { archetype: "pyre-70", name: "PYRE COLOSSUS", title: "GEOTHERMAL FORGE GUARDIAN", abilityLabel: "MAGMA ERUPTION RING", primaryColor: "#e65c2e", secondaryColor: "#3d1408", glowColor: "#ffdf6b", threatTier: 7 };
  if (floor === 80) return { archetype: "magma-80", name: "IGNIS OVERLORD", title: "ABYSSAL CORE TITAN", abilityLabel: "HELLFIRE STARBURST", primaryColor: "#d9362b", secondaryColor: "#330a08", glowColor: "#fff099", threatTier: 8 };
  if (floor === 90) return { archetype: "monolith-90", name: "ASTRAL HERALD", title: "PRE-SOVEREIGN HARBINGER", abilityLabel: "VOID SINGULARITY SLAM", primaryColor: "#c9962c", secondaryColor: "#302107", glowColor: "#ffffff", threatTier: 9 };
  if (floor === 100) return { archetype: "sovereign-100", name: "THE SIGNAL SOVEREIGN", title: "ORIGIN BROADCAST ARCHITECT", abilityLabel: "OMEGA CARRIER OVERLOAD", primaryColor: "#ffcf56", secondaryColor: "#3d2805", glowColor: "#ffffff", threatTier: 10 };
  return { archetype: "overdrive-apex", name: `APEX ANOMALY // MK-${Math.floor(floor / 10)}`, title: "BEYOND-SIGNAL ABERRATION", abilityLabel: "APOCALYPSE RESONANCE", primaryColor: "#ff477e", secondaryColor: "#2b0815", glowColor: "#ffdf6b", threatTier: 11 };
}
export type EnemyClassId = "stalker" | "duelist" | "bulwark" | "arcanist" | "boss";

export type EnemyLoreEntry = {
  id: EnemyClassId;
  title: string;
  weapon: WeaponArchetype;
  abilityName: string;
  lore: string;
};

export const ENEMY_LORE_CODEX: Record<EnemyClassId, EnemyLoreEntry> = {
  stalker: {
    id: "stalker",
    title: "Husk Stalker",
    weapon: "Sword",
    abilityName: "Predictive Pounce",
    lore: "Former perimeter guards whose visors fused shut when the first low-band pulse echoed upward.",
  },
  duelist: {
    id: "duelist",
    title: "Phase Duelist",
    weapon: "Rapier",
    abilityName: "Vector Needle Dash",
    lore: "Recon specialists tuned to high-frequency harmonics; they project a laser line before dashing.",
  },
  bulwark: {
    id: "bulwark",
    title: "Iron Bulwark",
    weapon: "Broadsword",
    abilityName: "Aegis Shield & Cleave",
    lore: "Heavy containment units welded inside reinforced plating. Flank their shield or bait their slam.",
  },
  arcanist: {
    id: "arcanist",
    title: "Signal Arcanist",
    weapon: "Plasma Cleaver",
    abilityName: "Lead-Target Volley",
    lore: "Acoustic engineers who calculate your movement vector and fire carrier-wave plasma bolts.",
  },
  boss: {
    id: "boss",
    title: "Sector Guardian / Sovereign",
    weapon: "Executioner",
    abilityName: "Signature Sector Overload",
    lore: "Anchors of the subterranean broadcast. Each Guardian locks a regional relay frequency until shattered.",
  },
};

export type SignalTape = {
  id: string;
  floorFound: number;
  title: string;
  transcript: string;
};

export const SIGNAL_TAPES_DB: SignalTape[] = [
  { id: "tape-10", floorFound: 10, title: "TAPE 01 // LOCKDOWN ORDER (F10)", transcript: "Bulkhead seals weren't tripped from the outside. Director Vance welded the elevator shafts shut from the bottom and left Iron Warden VANCE-01 to guard the gate." },
  { id: "tape-20", floorFound: 20, title: "TAPE 02 // OUTER BUNKER BREACH (F20)", transcript: "Surface array picked up an SOS repeating every 11.4 seconds from 200 meters down. Dreadnought K-20 crushed the rescue squad before they reached the coolant shafts." },
  { id: "tape-30", floorFound: 30, title: "TAPE 03 // CRYO LEAK (F30)", transcript: "The cooling towers aren't keeping a reactor cold—Matriarch Vex froze the conduits to stop an acoustic frequency from resonating through the bedrock." },
  { id: "tape-40", floorFound: 40, title: "TAPE 04 // SUB-ZERO SILENCE (F40)", transcript: "Below Floor 40, the coolant pipes hum in three-part harmony. Anyone who listens without a shielded visor walks willingly toward the Archive." },
  { id: "tape-50", floorFound: 50, title: "TAPE 05 // ECHO ARCHIVE (F50)", transcript: "Every distress call we heard on the surface was recorded three weeks in the future. Archivist Null was cataloging our own voices as bait." },
  { id: "tape-60", floorFound: 60, title: "TAPE 06 // HARMONIC CONVERGENCE (F60)", transcript: "The tape reels don't store data anymore—they store memories of surveyors who descended before us and never extracted." },
  { id: "tape-70", floorFound: 70, title: "TAPE 07 // THERMAL CORE (F70)", transcript: "The armor suits didn't fail. The crew climbed back into them voluntarily once they understood the melody rising from the geothermal fissures." },
  { id: "tape-80", floorFound: 80, title: "TAPE 08 // MAGMA CONDUIT (F80)", transcript: "At 1,600 meters depth, the bedrock itself acts like a tuning fork. Only Sovereign-grade alloys survive the vibration." },
  { id: "tape-90", floorFound: 90, title: "TAPE 09 // THRESHOLD MONOLITH (F90)", transcript: "Ten floors remain. Astral Herald stands at the final bulkhead—beyond it lies the origin carrier wave." },
  { id: "tape-100", floorFound: 100, title: "TAPE 10 // SOVEREIGN CARRIER (F100)", transcript: "Floor 100 wasn't a transmitter. It was a receiver waiting for one surveyor strong enough to shatter the Sovereign and claim the signal." },
];

export type CatalogBlueprint = {
  baseKey: string;
  slot: GearSlot;
  rarity: GearRarity;
  name: string;
  weaponType?: WeaponArchetype;
  variantIndex: number;
  basePower: number;
};

const CATALOG_NAMES: Record<GearSlot, Record<GearRarity, [string, string, string]>> = {
  weapon: {
    Common: ["Rusted Trench Blade", "Salvaged Rebar Cutter", "Bunker Utility Saber"],
    Uncommon: ["Cobalt Needle Rapier", "Cryo-Etched Foil", "Vanguard Duelsword"],
    Rare: ["Seismic Claymore", "Tectonic Broadsword", "Bastion Breaker"],
    Epic: ["Arc-Plasma Cleaver", "Harmonic Ripper", "Void-Edge Sawblade"],
    Legendary: ["Sovereign Executioner", "Omega Carrier Greatsword", "Chrono-Shatter Halberd"],
  },
  helmet: {
    Common: ["Scout Visor", "Miner Hardhat", "Padded Recon Cap"],
    Uncommon: ["Blast Helm", "Sonar Field Hood", "Reinforced Welder Mask"],
    Rare: ["Cryo Hood", "Tactical Optics Cowl", "Cobalt Assault Helm"],
    Epic: ["Aegis Cowl", "Phase-Shift Visor", "Neural Relay Crown"],
    Legendary: ["Sovereign Crown", "Apex Astral Helm", "Eternal Signal Crest"],
  },
  chestplate: {
    Common: ["Composite Vest", "Quilted Hazmat Tunic", "Scrap-Plate Jerkin"],
    Uncommon: ["Impact Cuirass", "Ballistic Carrier Vest", "Thermal Liner Rig"],
    Rare: ["Alloy Rig", "Cryo-Core Breastplate", "Shock-Absorb Harness"],
    Epic: ["Titan Plate", "Harmonic Carapace", "Phase-Weave Cuirass"],
    Legendary: ["Core Exo", "Sovereign Dreadplate", "Singularity Aegis"],
  },
  pants: {
    Common: ["Reinforced Greaves", "Canvas Work Trousers", "Patched Knee-Guards"],
    Uncommon: ["Cargo Slacks", "Padded Trench Leggings", "Rivet-Strapped Chaps"],
    Rare: ["Shock Leggings", "Hydraulic Striders", "Cobalt Shin-Plates"],
    Epic: ["Aegis Tassets", "Phase-Step Cuisses", "Gravity-Damp Greaves"],
    Legendary: ["Void Striders", "Sovereign War-Tassets", "Omega Kinetic Leggings"],
  },
  shoes: {
    Common: ["Tread Boots", "Rubber Sump Waders", "Steel-Toe Workboots"],
    Uncommon: ["Mag Soles", "Grip-Spike Cleats", "Scout Trail Runners"],
    Rare: ["Cryo Runners", "Piston-Spring Boots", "Cobalt Dash Greaves"],
    Epic: ["Phase Greaves", "Vector Thruster Boots", "Zero-G Sabatons"],
    Legendary: ["Apex Thrusters", "Sovereign Warp-Boots", "Chrono-Step Treads"],
  },
  necklace: {
    Common: ["Copper Dogtag", "Frayed Wire Charm", "Brass Bolt Pendant"],
    Uncommon: ["Quartz Locket", "Tuning-Fork Amulet", "Amber Relay Bead"],
    Rare: ["Cobalt Torc", "Cryo-Prism Choker", "Resonance Medallion"],
    Epic: ["Phase Reliquary", "Void-Glass Talisman", "Harmonic Core Locket"],
    Legendary: ["Signal Pendulum", "Sovereign Heart-Stone", "Singularity Astrolabe"],
  },
  ring: {
    Common: ["Iron Band", "Copper Washer Ring", "Scavenged Hex-Nut"],
    Uncommon: ["Capacitor Ring", "Static Coil Band", "Silver Survey Signet"],
    Rare: ["Cryo Signet", "Cobalt Pulse Ring", "Tectonic Seal"],
    Epic: ["Harmonic Loop", "Phase-Lock Band", "Aether Circuit Ring"],
    Legendary: ["Sovereign Seal", "Omega Carrier Signet", "Infinity Core Loop"],
  },
};

export const WEAPON_TIER_ORDER: WeaponArchetype[] = ["Sword", "Rapier", "Broadsword", "Plasma Cleaver", "Executioner"];

export const FULL_ITEM_CATALOG: CatalogBlueprint[] = (() => {
  const list: CatalogBlueprint[] = [];
  const rarities: GearRarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  for (const slot of ALL_GEAR_SLOTS) {
    for (let rIdx = 0; rIdx < rarities.length; rIdx++) {
      const rarity = rarities.at(rIdx)!;
      const rank = rIdx + 1;
      const trio = CATALOG_NAMES[slot][rarity];
      for (let v = 0; v < 3; v++) {
        const name = trio.at(v)!;
        const weaponType: WeaponArchetype | undefined = slot === "weapon" ? WEAPON_TIER_ORDER.at(rIdx) : undefined;
        list.push({
          baseKey: `${slot}:${rarity}:${name.toLowerCase()}`,
          slot,
          rarity,
          name,
          weaponType,
          variantIndex: v,
          basePower: rank * 4 + v,
        });
      }
    }
  }
  return list;
})();

export type BlockerShape = "octagon-reactor" | "diamond-monolith" | "angled-shield" | "relay-console";
export type RoomBlocker = { x: number; y: number; width: number; height: number; shape: BlockerShape };
export type BreakablePropKind = "crate" | "canister" | "crystal";
export type BreakableProp = { id: number; x: number; y: number; radius: number; kind: BreakablePropKind; health: number; maxHealth: number; broken: boolean };
export type RareChest = { x: number; y: number; opened: boolean; rarity: GearRarity };
export type ShopOffer = { id: string; kind: "gear" | "stim" | "mystery"; label: string; description: string; diamondCost: number; item?: GearItem; purchased: boolean };
export type RoomDefinition = { name: string; biome: BiomeDefinition; signalNote: string; blockers: RoomBlocker[]; props: BreakableProp[]; isBossFloor: boolean; isFinalBoss: boolean; bossSpec?: BossSpec; rareChest: RareChest | null };
export type EnemyProjectile = { id: number; x: number; y: number; vx: number; vy: number; damage: number; lifeMs: number; color: string };
export type CombatPopup = { id: number; x: number; y: number; text: string; color: string; lifeMs: number };
export type VisualParticle = { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; color: string; lifeMs: number; maxLifeMs: number };
export type BossEvent = { bossFloor: number; bossName: string; bossTitle: string; abilityLabel: string; subtitle: string; unlockedLink: number; bossSpec: BossSpec; loreTape: SignalTape | null; timestamp: number };
export type RunStatus = "title" | "entering-cave" | "briefing" | "playing" | "boss-lore" | "floor-clear" | "shop" | "victory-ending" | "escaped" | "defeated";
export type PlayerInput = { moveX: number; moveY: number; lookX: number; lookY: number; attack: boolean; guard: boolean; dodge: boolean; interact: boolean };

export type Enemy = {
  id: number;
  kind: EnemyClassId;
  weapon: WeaponArchetype;
  bossSpec?: BossSpec;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  flankAngle: number;
  windupMs: number;
  maxWindupMs: number;
  abilityCooldownMs: number;
  specialWindupMs: number;
  maxSpecialWindupMs: number;
  specialType: "none" | "dash" | "wave" | "slam" | "cryo-nova" | "phase-blink" | "cross-beam" | "starburst";
  aimTargetX: number;
  aimTargetY: number;
  attackCooldownMs: number;
  stunMs: number;
  hitFlashMs: number;
  facingX: number;
  facingY: number;
  strafeSign: number;
};

export type LootPickup = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  item?: GearItem;
  tapeId?: string;
  goldAmount?: number;
  diamondAmount?: number;
};

export type DeepSignalRun = {
  status: RunStatus;
  roomIndex: number;
  startFloor: number;
  currentRoom: RoomDefinition;
  overdriveMode: boolean;
  profile: SurveyorProfile;
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    level: number;
    xp: number;
    xpToNext: number;
    stats: SurveyorStats;
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
  projectiles: EnemyProjectile[];
  combatPopups: CombatPopup[];
  particles: VisualParticle[];
  hitstopMs: number;
  shakeMs: number;
  lastHitSound: { kind: "hit" | "parry" | "hurt"; seq: number } | null;
  lastKillSound: { isBoss: boolean; seq: number } | null;
  lastPickupSound: { kind: "gold" | "diamond" | "gear"; seq: number } | null;
  pickups: LootPickup[];
  carriedGear: GearItem[];
  carriedTapes: string[];
  carriedGold: number;
  carriedDiamonds: number;
  shopOffers: ShopOffer[];
  equippedGear: EquippedGearMap;
  kills: number;
  score: number;
  damageBlocked: number;
  roomCleared: boolean;
  lostGearCount: number;
  lastBossEvent: BossEvent | null;
  pendingBossLore: BossEvent | null;
  lastAscensionResult: {
    itemName: string;
    newRank: number;
    copiesUsed: number;
  } | null;
  message: string;
  attackWasDown: boolean;
  dodgeWasDown: boolean;
  interactWasDown: boolean;
};

export const RARITY_RANK: Record<GearRarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

let nextEntityId = 1;

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }
  
  function normalized(x: number, y: number, fallbackX = 1, fallbackY = 0) {
    const length = Math.hypot(x, y);
    if (length < 0.001) return { x: fallbackX, y: fallbackY };
    return { x: x / length, y: y / length };
  }
  
  function rectOverlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, padding = 0) {
    return ax - padding < bx + bw && ax + aw + padding > bx && ay - padding < by + bh && ay + ah + padding > by;
  }
  
  function collidesWithBlocker(x: number, y: number, room: RoomDefinition, radius = PLAYER_RADIUS) {
    const hitsWall = room.blockers.some(
      (blocker) =>
        x + radius > blocker.x &&
        x - radius < blocker.x + blocker.width &&
        y + radius > blocker.y &&
        y - radius < blocker.y + blocker.height,
    );
    if (hitsWall) return true;
    return room.props.some((prop) => !prop.broken && Math.hypot(x - prop.x, y - prop.y) < radius + prop.radius);
  }
  
  function rollRarity(floor: number, minRarity?: GearRarity): GearRarity {
    const bonus = Math.min(44, floor * 0.5);
    const roll = Math.random() * 100 + bonus;
    let rolled: GearRarity = "Common";
    if (roll > 122) rolled = "Legendary";
    else if (roll > 102) rolled = "Epic";
    else if (roll > 80) rolled = "Rare";
    else if (roll > 52) rolled = "Uncommon";
    if (minRarity && RARITY_RANK[rolled] < RARITY_RANK[minRarity]) return minRarity;
    return rolled;
  }
  
  export function makeGearFromBlueprint(bp: CatalogBlueprint, floor = 1): GearItem {
    const rank = RARITY_RANK[bp.rarity];
    const power = bp.basePower + Math.floor((floor - 1) / 6);
    const vBonus = bp.variantIndex * 2;
    return {
      id: "gear-" + Date.now().toString(36) + "-" + nextEntityId++,
      baseKey: bp.baseKey,
      name: bp.name,
      rarity: bp.rarity,
      slot: bp.slot,
      count: 1,
      power,
      attackBonus: bp.slot === "weapon" ? 8 + power * 2 + vBonus : bp.slot === "necklace" ? power * 2 + bp.variantIndex : bp.slot === "ring" ? power + bp.variantIndex : 0,
      healthBonus: bp.slot === "chestplate" ? 18 + power * 7 + vBonus * 3 : bp.slot === "helmet" ? 12 + power * 4 + vBonus * 2 : bp.slot === "pants" ? 14 + power * 5 + vBonus * 2 : bp.slot === "necklace" ? power * 4 : 0,
      guardBonus: bp.slot === "pants" ? 10 + power * 4 : bp.slot === "helmet" ? 8 + power * 4 : bp.slot === "ring" ? power * 5 : 0,
      agilityBonus: bp.slot === "shoes" ? 2 + rank * 2 + bp.variantIndex : bp.slot === "ring" ? rank * 2 : bp.slot === "necklace" ? rank : 0,
      weaponType: bp.weaponType,
      ascensionRank: 0,
    };
  }
  
  export function makeGear(floor: number, forcedSlot?: GearSlot, forcedRarity?: GearRarity): GearItem {
    const slot = forcedSlot ?? ALL_GEAR_SLOTS.at(Math.floor(Math.random() * ALL_GEAR_SLOTS.length))!;
    const rarity = forcedRarity ?? rollRarity(floor);
    const candidates = FULL_ITEM_CATALOG.filter((b) => b.slot === slot && b.rarity === rarity);
    const picked = candidates.at(Math.floor(Math.random() * candidates.length))!;
    return makeGearFromBlueprint(picked, floor);
  }
  
  function generateProceduralRoom(roomIndex: number): RoomDefinition {
    const floor = roomIndex + 1;
    const biome = getBiomeForFloor(floor);
    const isFinalBoss = floor === FINAL_BOSS_FLOOR;
    const isBossFloor = floor % 10 === 0;
    const bossSpec = isBossFloor ? getBossSpecForFloor(floor) : undefined;
    const blockerCount = isBossFloor ? 2 : 2 + (floor % 3);
    const blockers: RoomBlocker[] = [];
    const shapes: BlockerShape[] = ["octagon-reactor", "angled-shield", "diamond-monolith", "relay-console"];
  
    for (let i = 0; i < blockerCount; i++) {
      const shape = shapes.at((floor + i * 2) % shapes.length)!;
      for (let attempt = 0; attempt < 35; attempt++) {
        let width = 50;
        let height = 50;
        if (shape === "angled-shield") {
          const horizontal = (floor + i + attempt) % 2 === 0;
          width = horizontal ? 82 : 28;
          height = horizontal ? 26 : 74;
        } else if (shape === "diamond-monolith") {
          width = 44;
          height = 44;
        } else if (shape === "relay-console") {
          width = 66;
          height = 36;
        } else {
          width = 52;
          height = 52;
        }
        const bx = 185 + Math.floor(Math.random() * (WORLD_WIDTH - 365 - width));
        const by = 60 + Math.floor(Math.random() * (WORLD_HEIGHT - 120 - height));
        const hitsOther = blockers.some((existing) => rectOverlaps(bx, by, width, height, existing.x, existing.y, existing.width, existing.height, 48));
        if (hitsOther) continue;
        blockers.push({ x: bx, y: by, width, height, shape });
        break;
      }
    }
  
    const props: BreakableProp[] = [];
    const propCount = isBossFloor ? 3 : 4 + (floor % 3);
    const propKinds: BreakablePropKind[] = ["crate", "canister", "crystal"];
    for (let p = 0; p < propCount; p++) {
      const kind = propKinds.at((floor + p) % propKinds.length)!;
      for (let attempt = 0; attempt < 30; attempt++) {
        const px = 140 + Math.floor(Math.random() * (WORLD_WIDTH - 250));
        const py = 56 + Math.floor(Math.random() * (WORLD_HEIGHT - 112));
        const blocked = blockers.some((b) => rectOverlaps(px - 22, py - 22, 44, 44, b.x, b.y, b.width, b.height, 14));
        const nearOtherProp = props.some((other) => Math.hypot(px - other.x, py - other.y) < 42);
        const nearSpawn = Math.hypot(px - 74, py - WORLD_HEIGHT / 2) < 95;
        if (!blocked && !nearOtherProp && !nearSpawn) {
          const hp = kind === "crystal" ? 28 : kind === "canister" ? 18 : 22;
          props.push({ id: floor * 5000 + nextEntityId++, x: px, y: py, radius: 13, kind, health: hp, maxHealth: hp, broken: false });
          break;
        }
      }
    }
  
    let rareChest: RareChest | null = null;
    if (Math.random() < (isBossFloor ? 0.45 : 0.22)) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const cx = 220 + Math.floor(Math.random() * (WORLD_WIDTH - 320));
        const cy = 62 + Math.floor(Math.random() * (WORLD_HEIGHT - 124));
        const blocked = blockers.some((b) => rectOverlaps(cx - 18, cy - 18, 36, 36, b.x, b.y, b.width, b.height, 26));
        const hitsProp = props.some((pr) => Math.hypot(cx - pr.x, cy - pr.y) < 36);
        if (!blocked && !hitsProp) {
          rareChest = { x: cx, y: cy, opened: false, rarity: rollRarity(floor, "Rare") };
          break;
        }
      }
    }
  
    const sectorName = isFinalBoss
      ? "SIGNAL SOVEREIGN NEXUS · F100"
      : isBossFloor
        ? biome.name + " · GUARDIAN F" + floor
        : biome.name + " · FLOOR " + String(floor).padStart(2, "0");
  
    return {
      name: sectorName,
      biome,
      signalNote: isFinalBoss ? "The origin broadcast resonates at full amplitude." : isBossFloor ? "Seismic anchor detected. Defeating the Guardian locks a Signal Link." : biome.ambientNote,
      blockers,
      props,
      isBossFloor,
      isFinalBoss,
      bossSpec,
      rareChest,
    };
  }
  
  function findClearEnemySpawn(room: RoomDefinition, radius: number, minX: number, maxX: number, preferredY?: number) {
    if (preferredY !== undefined) {
      const startX = clamp(maxX - 30, minX, maxX);
      if (!collidesWithBlocker(startX, preferredY, room, radius + 8)) return { x: startX, y: preferredY };
    }
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = minX + Math.floor(Math.random() * Math.max(1, maxX - minX));
      const y = 52 + Math.floor(Math.random() * (WORLD_HEIGHT - 104));
      if (Math.hypot(x - 74, y - WORLD_HEIGHT / 2) > 190 && !collidesWithBlocker(x, y, room, radius + 8)) return { x, y };
    }
    for (let y = 56; y <= WORLD_HEIGHT - 56; y += 24) {
      if (!collidesWithBlocker(WORLD_WIDTH - 115, y, room, radius + 6)) return { x: WORLD_WIDTH - 115, y };
    }
    return { x: WORLD_WIDTH - 110, y: WORLD_HEIGHT / 2 };
  }
  
  function pickEnemyClassForFloor(floor: number, index: number): EnemyClassId {
    if (floor <= 2) return index % 3 === 2 ? "bulwark" : "stalker";
    if (floor <= 10) {
      const pool: EnemyClassId[] = ["stalker", "duelist", "bulwark"];
      return pool.at((floor + index) % pool.length)!;
    }
    const pool: EnemyClassId[] = ["stalker", "duelist", "bulwark", "arcanist"];
    return pool.at((floor * 3 + index) % pool.length)!;
  }
  
  function weaponForEnemyClass(kind: EnemyClassId): WeaponArchetype {
    switch (kind) {
      case "stalker": return "Sword";
      case "duelist": return "Rapier";
      case "bulwark": return "Broadsword";
      case "arcanist": return "Plasma Cleaver";
      case "boss": return "Executioner";
    }
  }
  
  const FLANK_SLOTS = Array.of(0, -0.95, 0.95, -1.75, 1.75, 2.5, -2.5, 3.14);
  
  function createEnemiesForRoom(roomIndex: number, room: RoomDefinition): Enemy[] {
    const floor = roomIndex + 1;
    const standardScale = 1 + (floor - 1) * 0.16;
    const bossScale = 1 + (floor - 1) * 0.24;
    const enemies: Enemy[] = [];
  
    if (room.isBossFloor) {
      const spec = room.bossSpec ?? getBossSpecForFloor(floor);
      const baseBossHp = room.isFinalBoss ? 780 : 240;
      const bossHp = Math.round(baseBossHp * bossScale);
      const bossPos = findClearEnemySpawn(room, 24, WORLD_WIDTH - 220, WORLD_WIDTH - 135, WORLD_HEIGHT / 2);
  
      enemies.push({
        id: floor * 1000 + 1,
        kind: "boss",
        weapon: "Executioner",
        bossSpec: spec,
        x: bossPos.x,
        y: bossPos.y,
        health: bossHp,
        maxHealth: bossHp,
        speed: Math.min(132, 74 + floor * 0.4),
        damage: Math.round((room.isFinalBoss ? 36 : 24) * (1 + (floor - 1) * 0.06)),
        flankAngle: 0,
        windupMs: 0,
        maxWindupMs: 560,
        abilityCooldownMs: 2100,
        specialWindupMs: 0,
        maxSpecialWindupMs: 680,
        specialType: "none",
        aimTargetX: 74,
        aimTargetY: WORLD_HEIGHT / 2,
        attackCooldownMs: 420,
        stunMs: 0,
        hitFlashMs: 0,
        facingX: -1,
        facingY: 0,
        strafeSign: 1,
      });
    }
  
    const mobCount = room.isBossFloor
      ? Math.min(4, 1 + Math.floor(floor / 25))
      : Math.min(11, 3 + Math.floor(floor / 4));
  
    for (let i = 0; i < mobCount; i++) {
      const kind = pickEnemyClassForFloor(floor, i);
      const radius = kind === "bulwark" ? 15 : 12;
      const baseHp = kind === "bulwark" ? 76 : kind === "arcanist" ? 50 : kind === "duelist" ? 48 : 44;
      const hp = Math.round(baseHp * standardScale);
      const baseSpeed = kind === "duelist" ? 124 : kind === "bulwark" ? 70 : kind === "arcanist" ? 84 : 102;
      const baseDamage = kind === "bulwark" ? 20 : kind === "arcanist" ? 16 : kind === "duelist" ? 15 : 13;
      const spawn = findClearEnemySpawn(room, radius, 290, WORLD_WIDTH - 95);
  
      enemies.push({
        id: floor * 1000 + i + 10,
        kind,
        weapon: weaponForEnemyClass(kind),
        x: spawn.x,
        y: spawn.y,
        health: hp,
        maxHealth: hp,
        speed: Math.min(174, baseSpeed + floor * 0.42),
        damage: Math.round(baseDamage * (1 + (floor - 1) * 0.055)),
        flankAngle: FLANK_SLOTS.at(i % FLANK_SLOTS.length) ?? 0,
        windupMs: 0,
        maxWindupMs: kind === "bulwark" ? 580 : 440,
        abilityCooldownMs: 1450 + i * 320,
        specialWindupMs: 0,
        maxSpecialWindupMs: kind === "duelist" ? 380 : 450,
        specialType: "none",
        aimTargetX: 74,
        aimTargetY: WORLD_HEIGHT / 2,
        attackCooldownMs: 220 + i * 95,
        stunMs: 0,
        hitFlashMs: 0,
        facingX: -1,
        facingY: 0,
        strafeSign: i % 2 === 0 ? 1 : -1,
      });
    }
  
    return enemies;
  }
  
  export function getEffectiveGearStats(item: GearItem, slotLevel = 1) {
    const slotMult = 1 + (Math.max(1, slotLevel) - 1) * 0.08;
    const ascendMult = Math.pow(1.28, Math.max(0, item.ascensionRank));
    const mult = slotMult * ascendMult;
    return {
      attack: Math.round(item.attackBonus * mult),
      health: Math.round(item.healthBonus * mult),
      guard: Math.round(item.guardBonus * mult),
      agility: Math.round(item.agilityBonus * (1 + (Math.max(1, slotLevel) - 1) * 0.04 + item.ascensionRank * 0.12)),
    };
  }
  
  export function computePlayerMaxStats(level: number, stats: SurveyorStats, equipped: EquippedGearMap, slotUpgrades?: SlotUpgradeMap) {
    let bonusHp = 0;
    let bonusStamina = 0;
    let bonusAtk = 0;
    let bonusAgi = 0;
    for (const slot of ALL_GEAR_SLOTS) {
      const item = equipped[slot];
      if (!item) continue;
      const eff = getEffectiveGearStats(item, slotUpgrades ? slotUpgrades[slot] : 1);
      bonusHp += eff.health;
      bonusStamina += eff.guard;
      bonusAtk += eff.attack;
      bonusAgi += eff.agility;
    }
    return {
      maxHealth: 115 + (level - 1) * 8 + stats.healthPoints * 14 + bonusHp,
      maxStamina: 100 + stats.agilityPoints * 7 + bonusStamina,
      totalAttack: 15 + (level - 1) * 2 + stats.damagePoints * 5 + bonusAtk,
      moveSpeedBonus: Math.min(140, stats.agilityPoints * 5 + bonusAgi),
    };
  }
  
  function makePlayerForProfile(profile: SurveyorProfile) {
    const computed = computePlayerMaxStats(profile.level, profile.stats, profile.equippedGear, profile.slotUpgradeLevels);
    return {
      x: 74,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      health: computed.maxHealth,
      maxHealth: computed.maxHealth,
      stamina: computed.maxStamina,
      maxStamina: computed.maxStamina,
      level: profile.level,
      xp: profile.xp,
      xpToNext: profile.xpToNext,
      stats: { ...profile.stats },
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
  
  function generateDiamondShopOffers(floor: number): ShopOffer[] {
    const mysteryCost = 3 + Math.floor(Math.random() * 10);
    const featuredSlot: GearSlot = ALL_GEAR_SLOTS.at(Math.floor(Math.random() * ALL_GEAR_SLOTS.length))!;
    const featuredItem = makeGear(floor + 3, featuredSlot, floor >= 25 ? "Legendary" : "Epic");
    return [
      { id: "shop-stim", kind: "stim", label: "Nanite Repair Stim", description: "Restores 100% HP & Stamina immediately.", diamondCost: 2, purchased: false },
      { id: "shop-mystery", kind: "mystery", label: "Mystery Relic Cache", description: "Decrypts a random gear piece across all rarities.", diamondCost: mysteryCost, purchased: false },
      { id: "shop-gear-featured", kind: "gear", label: `${featuredItem.name} (${featuredItem.rarity})`, description: `Tier ${featuredItem.power} ${featuredItem.slot.toUpperCase()} · Stackable for Fusion.`, diamondCost: featuredItem.rarity === "Legendary" ? 14 : 9, item: featuredItem, purchased: false },
    ];
  }
  export function createDeepSignalRun(profile: SurveyorProfile = createDefaultSurveyorProfile(), startFloor = 1, initialStatus: RunStatus = "title"): DeepSignalRun {
    const validStart = profile.unlockedSignalLinks.includes(startFloor) ? startFloor : 1;
    const roomIndex = Math.max(0, validStart - 1);
    const firstRoom = generateProceduralRoom(roomIndex);
    return {
      status: initialStatus,
      roomIndex,
      startFloor: validStart,
      currentRoom: firstRoom,
      overdriveMode: false,
      profile,
      player: makePlayerForProfile(profile),
      enemies: createEnemiesForRoom(roomIndex, firstRoom),
      projectiles: [],
      combatPopups: [],
      particles: [],
      hitstopMs: 0,
      shakeMs: 0,
      lastHitSound: null,
      lastKillSound: null,
      lastPickupSound: null,
      pickups: [],
      carriedGear: [],
      carriedTapes: [],
      carriedGold: 0,
      carriedDiamonds: 0,
      shopOffers: [],
      equippedGear: { ...profile.equippedGear },
      kills: 0,
      score: 0,
      damageBlocked: 0,
      roomCleared: false,
      lostGearCount: 0,
      lastBossEvent: null,
      pendingBossLore: null,
      lastAscensionResult: null,
      message: "Press START DESCENT to enter the subterranean complex.",
      attackWasDown: false,
      dodgeWasDown: false,
      interactWasDown: false,
    };
  }
  
  export function startDeepSignalRun(state: DeepSignalRun, requestedFloor?: number): DeepSignalRun {
    const chosenFloor = requestedFloor && state.profile.unlockedSignalLinks.includes(requestedFloor) ? requestedFloor : state.startFloor;
    const fresh = createDeepSignalRun(state.profile, chosenFloor, "playing");
    return { ...fresh, message: "FLOOR " + String(chosenFloor).padStart(2, "0") + " · " + fresh.currentRoom.biome.name };
  }
  
  function moveCharacter(x: number, y: number, dx: number, dy: number, room: RoomDefinition, radius = PLAYER_RADIUS) {
    let nextX = clamp(x + dx, 28, WORLD_WIDTH - 28);
    if (collidesWithBlocker(nextX, y, room, radius)) nextX = x;
    let nextY = clamp(y + dy, 28, WORLD_HEIGHT - 28);
    if (collidesWithBlocker(nextX, nextY, room, radius)) nextY = y;
    return { x: nextX, y: nextY };
  }
  
  function moveEnemyTactical(enemy: Enemy, playerX: number, playerY: number, playerVx: number, playerVy: number, distance: number, seconds: number, room: RoomDefinition) {
    const radius = enemy.kind === "boss" ? 20 : enemy.kind === "bulwark" ? 14 : 11;
    const stepDist = enemy.speed * seconds;
    const leadTime = Math.min(0.45, distance / Math.max(120, enemy.speed * 2.2));
    let targetX = clamp(playerX + playerVx * leadTime, 34, WORLD_WIDTH - 34);
    let targetY = clamp(playerY + playerVy * leadTime, 34, WORLD_HEIGHT - 34);
  
    if (distance > 115 && enemy.kind !== "boss") {
      const baseFromPlayer = Math.atan2(enemy.y - targetY, enemy.x - targetX);
      const orbitAngle = baseFromPlayer + enemy.flankAngle * 0.45;
      targetX = clamp(targetX + Math.cos(orbitAngle) * 82, 34, WORLD_WIDTH - 34);
      targetY = clamp(targetY + Math.sin(orbitAngle) * 82, 34, WORLD_HEIGHT - 34);
    }
  
    const baseAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    const candidateAngles = [
      baseAngle,
      baseAngle + enemy.strafeSign * 0.5,
      baseAngle - enemy.strafeSign * 0.5,
      baseAngle + enemy.strafeSign * 1.0,
      baseAngle - enemy.strafeSign * 1.0,
      baseAngle + enemy.strafeSign * 1.5,
      baseAngle - enemy.strafeSign * 1.5,
    ];
  
    for (let i = 0; i < candidateAngles.length; i++) {
      const angle = candidateAngles.at(i)!;
      const vx = Math.cos(angle);
      const vy = Math.sin(angle);
      const lookAheadX = clamp(enemy.x + vx * Math.max(stepDist, 14), 28, WORLD_WIDTH - 28);
      const lookAheadY = clamp(enemy.y + vy * Math.max(stepDist, 14), 28, WORLD_HEIGHT - 28);
      if (!collidesWithBlocker(lookAheadX, lookAheadY, room, radius)) {
        const moved = moveCharacter(enemy.x, enemy.y, vx * stepDist, vy * stepDist, room, radius);
        if (Math.hypot(moved.x - enemy.x, moved.y - enemy.y) > stepDist * 0.35) {
          return { x: moved.x, y: moved.y, flipStrafe: i >= 3 && i % 2 === 1 };
        }
      }
    }
  
    const toward = normalized(playerX - enemy.x, playerY - enemy.y, -1, 0);
    const fallback = moveCharacter(enemy.x, enemy.y, toward.x * stepDist, toward.y * stepDist, room, radius);
    return { x: fallback.x, y: fallback.y, flipStrafe: true };
  }
  
  function getWeaponSwingSpec(weapon?: WeaponArchetype) {
    switch (weapon) {
      case "Rapier": return { range: 102, coneDot: 0.4, cooldown: 205, knockback: 9, damageMult: 0.98 };
      case "Broadsword": return { range: 96, coneDot: -0.05, cooldown: 330, knockback: 19, damageMult: 1.14 };
      case "Plasma Cleaver": return { range: 114, coneDot: 0.1, cooldown: 285, knockback: 15, damageMult: 1.22 };
      case "Executioner": return { range: 112, coneDot: -0.15, cooldown: 370, knockback: 24, damageMult: 1.38 };
      case "Sword":
      default: return { range: 90, coneDot: 0.15, cooldown: 270, knockback: 13, damageMult: 1.0 };
    }
  }
  export function stepDeepSignalRun(state: DeepSignalRun, input: PlayerInput, deltaMs: number): DeepSignalRun {
    if (state.status !== "playing") return state;
    const rawDt = clamp(deltaMs, 0, 50);
  
    if (state.hitstopMs > 0) {
      const nextHitstop = Math.max(0, state.hitstopMs - rawDt);
      const nextParticles = state.particles
        .map((pt) => ({ ...pt, x: pt.x + pt.vx * (rawDt / 1000), y: pt.y + pt.vy * (rawDt / 1000), z: Math.max(0, pt.z + pt.vz * (rawDt / 1000)), vz: pt.vz - 240 * (rawDt / 1000), lifeMs: pt.lifeMs - rawDt }))
        .filter((pt) => pt.lifeMs > 0);
      return { ...state, hitstopMs: nextHitstop, shakeMs: Math.max(0, state.shakeMs - rawDt), particles: nextParticles };
    }
  
    const dt = rawDt;
    const seconds = dt / 1000;
    const floor = state.roomIndex + 1;
    const player = { ...state.player, stats: { ...state.player.stats } };
    let enemies = state.enemies.map((enemy) => ({ ...enemy }));
    let projectiles = state.projectiles.map((proj) => ({ ...proj }));
    let combatPopups = state.combatPopups.map((p) => ({ ...p, y: p.y - 28 * seconds, lifeMs: p.lifeMs - dt })).filter((p) => p.lifeMs > 0);
    let particles = state.particles.map((pt) => ({ ...pt, x: pt.x + pt.vx * seconds, y: pt.y + pt.vy * seconds, z: Math.max(0, pt.z + pt.vz * seconds), vz: pt.vz - 280 * seconds, lifeMs: pt.lifeMs - dt })).filter((pt) => pt.lifeMs > 0);
    let pickups = state.pickups.map((pk) => ({ ...pk }));
    let carriedGear = [...state.carriedGear];
    let carriedTapes = [...state.carriedTapes];
    let carriedGold = state.carriedGold;
    let carriedDiamonds = state.carriedDiamonds;
    let shopOffers = state.shopOffers;
    const equippedGear = { ...state.equippedGear };
    let profile = {
      ...state.profile,
      unlockedSignalLinks: [...state.profile.unlockedSignalLinks],
      decodedTapes: [...state.profile.decodedTapes],
      discoveredEnemies: [...state.profile.discoveredEnemies],
      discoveredItems: [...state.profile.discoveredItems],
    };
    let currentRoom: RoomDefinition = {
      ...state.currentRoom,
      props: state.currentRoom.props.map((pr) => ({ ...pr })),
      rareChest: state.currentRoom.rareChest ? { ...state.currentRoom.rareChest } : null,
    };
  
    let score = state.score;
    let kills = state.kills;
    let damageBlocked = state.damageBlocked;
    let roomCleared = state.roomCleared;
    let lostGearCount = state.lostGearCount;
    let lastBossEvent = state.lastBossEvent;
    let pendingBossLore = state.pendingBossLore;
    let hitstopMs = 0;
    let shakeMs = Math.max(0, state.shakeMs - dt);
    let lastHitSound = state.lastHitSound;
    let lastKillSound = state.lastKillSound;
    let lastPickupSound = state.lastPickupSound;
    let status: RunStatus = state.status;
    let message = state.message;
  
    const pushPopup = (x: number, y: number, text: string, color: string) => {
      combatPopups.push({ id: nextEntityId++, x, y: y - 16, text, color, lifeMs: 820 });
    };
  
    const spawnBurstParticles = (x: number, y: number, colors: string[], count: number, speedScale = 1) => {
      for (let i = 0; i < count; i++) {
        const ang = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.55;
        const spd = (45 + Math.random() * 115) * speedScale;
        const life = 280 + Math.random() * 260;
        particles.push({ id: nextEntityId++, x, y, z: 6 + Math.random() * 10, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.72, vz: 65 + Math.random() * 95, size: 2 + Math.floor(Math.random() * 3), color: colors.at(i % colors.length)!, lifeMs: life, maxLifeMs: life });
      }
    };
  
    const triggerHitAudio = (kind: "hit" | "parry" | "hurt") => {
      lastHitSound = { kind, seq: (lastHitSound?.seq ?? 0) + 1 };
    };
  
    const computedStats = computePlayerMaxStats(player.level, player.stats, equippedGear, profile.slotUpgradeLevels);
    player.maxHealth = computedStats.maxHealth;
    player.maxStamina = computedStats.maxStamina;
  
    const gearPowerRatio = Math.max(1, computedStats.totalAttack / Math.max(25, 22 + floor * 2.2));
    const adaptiveEnemyDmgMult = floor >= 25 ? Math.min(2.2, 1 + (gearPowerRatio - 1) * 0.28) : 1;
  
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
      player.dodgeMs = 200;
      player.dodgeCooldownMs = Math.max(360, 560 - player.stats.agilityPoints * 9);
      player.invulnerableMs = Math.max(player.invulnerableMs, 260);
      player.facingX = dodgeDirection.x;
      player.facingY = dodgeDirection.y;
      spawnBurstParticles(player.x, player.y, ["#6fe3c1", "#ffffff"], 7, 0.7);
      pushPopup(player.x, player.y, "DASH!", "#79f2cc");
    }
  
    const staminaDrain = input.guard ? 7 : -38;
    player.stamina = clamp(player.stamina - staminaDrain * seconds, 0, player.maxStamina);
    player.guarding = input.guard && player.stamina > 0;
    let moveSpeed = (player.guarding ? 132 : 196) + computedStats.moveSpeedBonus;
    if (player.dodgeMs > 0) moveSpeed = 395 + computedStats.moveSpeedBonus;
  
    const prevX = player.x;
    const prevY = player.y;
    const nextPosition = moveCharacter(player.x, player.y, movement.x * moveSpeed * seconds, movement.y * moveSpeed * seconds, currentRoom);
    player.x = nextPosition.x;
    player.y = nextPosition.y;
    player.vx = seconds > 0 ? (player.x - prevX) / seconds : 0;
    player.vy = seconds > 0 ? (player.y - prevY) / seconds : 0;
  
    if (currentRoom.rareChest && !currentRoom.rareChest.opened) {
      if (Math.hypot(currentRoom.rareChest.x - player.x, currentRoom.rareChest.y - player.y) < 38) {
        currentRoom.rareChest.opened = true;
        const accessorySlot: GearSlot = Math.random() < 0.5 ? "necklace" : "ring";
        const jewelryDrop = makeGear(floor, accessorySlot, currentRoom.rareChest.rarity);
        pickups.push({ id: floor * 9000 + nextEntityId++, x: currentRoom.rareChest.x, y: currentRoom.rareChest.y + 14, z: 10, vx: 0, vy: 18, vz: 85, item: jewelryDrop });
        spawnBurstParticles(currentRoom.rareChest.x, currentRoom.rareChest.y, ["#ffcf56", "#ffffff"], 12);
        pushPopup(currentRoom.rareChest.x, currentRoom.rareChest.y, jewelryDrop.rarity.toUpperCase() + " CHEST!", "#ffdf6b");
        message = "RARE CHEST OPENED! " + jewelryDrop.name.toUpperCase();
      }
    }
  
    if (input.attack && !state.attackWasDown && !player.guarding && player.attackCooldownMs <= 0) {
      const swing = getWeaponSwingSpec(equippedGear.weapon?.weaponType);
      player.attackCooldownMs = Math.max(150, swing.cooldown - player.stats.agilityPoints * 4);
      player.attackMs = 200;
      const direction = { x: player.facingX, y: player.facingY };
      const totalAttack = Math.round(computedStats.totalAttack * swing.damageMult);
      let landedHit = false;
  
      for (const prop of currentRoom.props) {
        if (prop.broken) continue;
        const toProp = normalized(prop.x - player.x, prop.y - player.y);
        const dist = Math.hypot(prop.x - player.x, prop.y - player.y);
        if (dist <= swing.range && direction.x * toProp.x + direction.y * toProp.y >= swing.coneDot - 0.15) {
          prop.health -= totalAttack;
          landedHit = true;
          if (prop.health <= 0) {
            prop.broken = true;
            const colors = prop.kind === "crystal" ? ["#63d2ff", "#c9ecff"] : prop.kind === "canister" ? ["#6fe3c1", "#395952"] : ["#b58954", "#6e4e2e"];
            spawnBurstParticles(prop.x, prop.y, colors, 10, 0.85);
            player.stamina = Math.min(player.maxStamina, player.stamina + 12);
            pushPopup(prop.x, prop.y, "SMASHED! +STA", "#8de8cb");
          } else {
            spawnBurstParticles(prop.x, prop.y, ["#d8eee4"], 4, 0.5);
            pushPopup(prop.x, prop.y, `-${totalAttack}`, "#d8eee4");
          }
        }
      }
  
      enemies = enemies.map((enemy) => {
        const toEnemy = normalized(enemy.x - player.x, enemy.y - player.y);
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        const reach = enemy.kind === "boss" ? swing.range + 22 : swing.range;
        if (distance > reach || direction.x * toEnemy.x + direction.y * toEnemy.y < swing.coneDot) return enemy;
  
        const enemyFacingDot = enemy.facingX * toEnemy.x + enemy.facingY * toEnemy.y;
        const frontalGuard = enemy.kind === "bulwark" && enemy.stunMs <= 0 && enemyFacingDot < -0.45;
        const isBackstab = enemyFacingDot > 0.35;
        const executeBonus = equippedGear.weapon?.weaponType === "Executioner" && enemy.health < enemy.maxHealth * 0.4 ? 1.35 : 1;
        const dealt = Math.max(3, Math.round(totalAttack * executeBonus * (frontalGuard ? 0.35 : isBackstab ? 1.3 : 1)));
  
        landedHit = true;
        spawnBurstParticles(enemy.x, enemy.y, frontalGuard ? ["#9cb3c9", "#ffffff"] : isBackstab ? ["#ffcf56", "#ff6b5e"] : ["#ff8a75", "#ffd15c"], frontalGuard ? 5 : 8, 0.75);
        pushPopup(enemy.x, enemy.y, frontalGuard ? `SHIELD -${dealt}` : isBackstab ? `BACKSTAB -${dealt}!` : `-${dealt}`, frontalGuard ? "#9cb3c9" : isBackstab ? "#ffd15c" : "#ff8a75");
        const knockback = enemy.kind === "boss" ? 5 : frontalGuard ? 5 : swing.knockback;
        const radius = enemy.kind === "boss" ? 20 : enemy.kind === "bulwark" ? 14 : 11;
        const knocked = moveCharacter(enemy.x, enemy.y, toEnemy.x * knockback, toEnemy.y * knockback, currentRoom, radius);
        return {
          ...enemy,
          health: Math.max(0, enemy.health - dealt),
          stunMs: enemy.kind === "boss" ? 75 : frontalGuard ? 65 : 190,
          hitFlashMs: 110,
          x: knocked.x,
          y: knocked.y,
        };
      });
  
      if (landedHit) {
        triggerHitAudio("hit");
        shakeMs = Math.max(shakeMs, 100);
      }
    }
  
    const resolveIncomingDamage = (baseDamage: number, sourceX: number, sourceY: number, unblockedLabel: string, canStunAttacker?: Enemy) => {
      const scaledDmg = Math.max(2, Math.round(baseDamage * adaptiveEnemyDmgMult));
      const fromDir = normalized(sourceX - player.x, sourceY - player.y, player.facingX, player.facingY);
      const facingDot = player.facingX * fromDir.x + player.facingY * fromDir.y;
  
      if (player.guarding && player.stamina >= 6 && facingDot > -0.25) {
        const isCleanParry = facingDot > 0.35 && player.stamina >= 14;
        if (isCleanParry) {
          player.stamina = clamp(player.stamina - 8, 0, player.maxStamina);
          damageBlocked += scaledDmg;
          player.invulnerableMs = 340;
          hitstopMs = 35;
          triggerHitAudio("parry");
          spawnBurstParticles(player.x + player.facingX * 12, player.y + player.facingY * 12, ["#6fe3c1", "#ffffff"], 10);
          pushPopup(player.x, player.y, "PARRIED 100%!", "#6fe3c1");
          if (canStunAttacker && canStunAttacker.kind !== "boss") canStunAttacker.stunMs = 380;
          message = "SHIELD PARRY! COUNTER NOW";
        } else {
          const reduced = Math.max(1, Math.round(scaledDmg * 0.35));
          const blockedAmt = scaledDmg - reduced;
          player.stamina = clamp(player.stamina - 10, 0, player.maxStamina);
          player.health = Math.max(0, player.health - reduced);
          damageBlocked += blockedAmt;
          player.invulnerableMs = 380;
          triggerHitAudio("parry");
          spawnBurstParticles(player.x + player.facingX * 10, player.y + player.facingY * 10, ["#6fe3c1"], 6, 0.6);
          pushPopup(player.x, player.y, `BLOCKED -${reduced}`, "#79f2cc");
          message = `GUARD MITIGATED ${blockedAmt} DMG`;
        }
      } else {
        player.health = Math.max(0, player.health - scaledDmg);
        player.invulnerableMs = 440;
        shakeMs = Math.max(shakeMs, 155);
        triggerHitAudio("hurt");
        spawnBurstParticles(player.x, player.y, ["#ff5442", "#ffcf56"], 8, 0.8);
        pushPopup(player.x, player.y, `-${scaledDmg}`, "#ff5442");
        message = unblockedLabel;
      }
    };
  
    enemies = enemies.map((enemy) => {
      if (enemy.health <= 0) return enemy;
      if (!profile.discoveredEnemies.includes(enemy.kind)) profile.discoveredEnemies.push(enemy.kind);
  
      const nextEnemy = {
        ...enemy,
        hitFlashMs: Math.max(0, enemy.hitFlashMs - dt),
        attackCooldownMs: Math.max(0, enemy.attackCooldownMs - dt),
        abilityCooldownMs: Math.max(0, enemy.abilityCooldownMs - dt),
      };
  
      if (nextEnemy.stunMs > 0) {
        nextEnemy.stunMs = Math.max(0, nextEnemy.stunMs - dt);
        return nextEnemy;
      }
  
      const toPlayer = normalized(player.x - nextEnemy.x, player.y - nextEnemy.y, -1, 0);
      const dist = Math.hypot(player.x - nextEnemy.x, player.y - nextEnemy.y);
      nextEnemy.facingX = toPlayer.x;
      nextEnemy.facingY = toPlayer.y;
  
      const radius = nextEnemy.kind === "boss" ? 20 : nextEnemy.kind === "bulwark" ? 14 : 11;
      const meleeReach = nextEnemy.kind === "boss" ? 66 : nextEnemy.kind === "bulwark" ? 48 : 40;
  
      if (nextEnemy.specialWindupMs > 0) {
        nextEnemy.specialWindupMs = Math.max(0, nextEnemy.specialWindupMs - dt);
        if (nextEnemy.specialWindupMs === 0) {
          if (nextEnemy.specialType === "dash") {
            const dashVec = normalized(nextEnemy.aimTargetX - nextEnemy.x, nextEnemy.aimTargetY - nextEnemy.y, toPlayer.x, toPlayer.y);
            const dashed = moveCharacter(nextEnemy.x, nextEnemy.y, dashVec.x * 115, dashVec.y * 115, currentRoom, radius);
            nextEnemy.x = dashed.x;
            nextEnemy.y = dashed.y;
            spawnBurstParticles(nextEnemy.x, nextEnemy.y, ["#d18ce8", "#ffffff"], 8, 0.8);
            if (Math.hypot(player.x - nextEnemy.x, player.y - nextEnemy.y) < 42 && player.invulnerableMs <= 0) {
              resolveIncomingDamage(Math.round(nextEnemy.damage * 1.15), nextEnemy.x, nextEnemy.y, "VECTOR NEEDLE STRIKE!", nextEnemy);
            }
          } else if (nextEnemy.specialType === "wave") {
            const shotDir = normalized(nextEnemy.aimTargetX - nextEnemy.x, nextEnemy.aimTargetY - nextEnemy.y, toPlayer.x, toPlayer.y);
            projectiles.push({ id: nextEntityId++, x: nextEnemy.x + shotDir.x * 16, y: nextEnemy.y + shotDir.y * 16, vx: shotDir.x * 245, vy: shotDir.y * 245, damage: nextEnemy.damage, lifeMs: 2200, color: "#63d2ff" });
          } else if (nextEnemy.specialType === "slam" || nextEnemy.specialType === "cryo-nova" || nextEnemy.specialType === "cross-beam" || nextEnemy.specialType === "starburst") {
            const ringCount = nextEnemy.specialType === "starburst" ? 10 : nextEnemy.specialType === "cryo-nova" ? 8 : 6;
            const ringCol = nextEnemy.bossSpec?.glowColor ?? "#ffcf56";
            spawnBurstParticles(nextEnemy.x, nextEnemy.y, [ringCol, "#ff5442"], 16, 1.1);
            for (let r = 0; r < ringCount; r++) {
              const ang = ((Math.PI * 2) / ringCount) * r;
              projectiles.push({ id: nextEntityId++, x: nextEnemy.x + Math.cos(ang) * 20, y: nextEnemy.y + Math.sin(ang) * 20, vx: Math.cos(ang) * 210, vy: Math.sin(ang) * 210, damage: Math.round(nextEnemy.damage * 0.9), lifeMs: 2000, color: ringCol });
            }
            if (dist < 118 && player.invulnerableMs <= 0) {
              resolveIncomingDamage(Math.round(nextEnemy.damage * 1.25), nextEnemy.x, nextEnemy.y, "SECTOR OVERLOAD HIT!", nextEnemy);
            }
          } else if (nextEnemy.specialType === "phase-blink") {
            const blinkX = clamp(player.x - toPlayer.x * 58, 36, WORLD_WIDTH - 36);
            const blinkY = clamp(player.y - toPlayer.y * 58, 36, WORLD_HEIGHT - 36);
            if (!collidesWithBlocker(blinkX, blinkY, currentRoom, radius)) {
              nextEnemy.x = blinkX;
              nextEnemy.y = blinkY;
            }
            spawnBurstParticles(nextEnemy.x, nextEnemy.y, ["#eabfff", "#ffffff"], 12, 0.9);
          }
          nextEnemy.specialType = "none";
          nextEnemy.abilityCooldownMs = nextEnemy.kind === "boss" ? 2600 : 2400;
        }
        return nextEnemy;
      }
  
      if (nextEnemy.windupMs > 0) {
        nextEnemy.windupMs = Math.max(0, nextEnemy.windupMs - dt);
        if (nextEnemy.windupMs === 0) {
          if (dist <= meleeReach + 12 && player.invulnerableMs <= 0) {
            resolveIncomingDamage(nextEnemy.damage, nextEnemy.x, nextEnemy.y, `${nextEnemy.weapon.toUpperCase()} HIT!`, nextEnemy);
          }
          nextEnemy.attackCooldownMs = nextEnemy.kind === "boss" ? 780 : 920;
        }
        return nextEnemy;
      }
      if (nextEnemy.abilityCooldownMs <= 0 && dist < 340) {
        if (nextEnemy.kind === "duelist" && dist > 75 && dist < 210) {
          nextEnemy.specialType = "dash";
          nextEnemy.specialWindupMs = 380;
          nextEnemy.maxSpecialWindupMs = 380;
          nextEnemy.aimTargetX = player.x;
          nextEnemy.aimTargetY = player.y;
          return nextEnemy;
        }
        if (nextEnemy.kind === "arcanist" && dist > 90) {
          nextEnemy.specialType = "wave";
          nextEnemy.specialWindupMs = 440;
          nextEnemy.maxSpecialWindupMs = 440;
          nextEnemy.aimTargetX = clamp(player.x + player.vx * 0.35, 30, WORLD_WIDTH - 30);
          nextEnemy.aimTargetY = clamp(player.y + player.vy * 0.35, 30, WORLD_HEIGHT - 30);
          return nextEnemy;
        }
        if (nextEnemy.kind === "boss") {
          const tier = nextEnemy.bossSpec?.threatTier ?? 1;
          nextEnemy.specialType = tier >= 8 ? "starburst" : tier >= 6 ? "cross-beam" : tier === 5 ? "phase-blink" : tier >= 3 ? "cryo-nova" : "slam";
          nextEnemy.specialWindupMs = 660;
          nextEnemy.maxSpecialWindupMs = 660;
          nextEnemy.aimTargetX = player.x;
          nextEnemy.aimTargetY = player.y;
          return nextEnemy;
        }
      }
  
      if (dist <= meleeReach && nextEnemy.attackCooldownMs <= 0) {
        nextEnemy.windupMs = nextEnemy.maxWindupMs;
        return nextEnemy;
      }
  
      const preferredKeepDist = nextEnemy.kind === "arcanist" ? 165 : meleeReach - 6;
      if (dist > preferredKeepDist) {
        const moved = moveEnemyTactical(nextEnemy, player.x, player.y, player.vx, player.vy, dist, seconds, currentRoom);
        nextEnemy.x = moved.x;
        nextEnemy.y = moved.y;
        if (moved.flipStrafe) nextEnemy.strafeSign *= -1;
      }
  
      return nextEnemy;
    });
  
    projectiles = projectiles.filter((proj) => {
      proj.lifeMs -= dt;
      if (proj.lifeMs <= 0) return false;
      proj.x += proj.vx * seconds;
      proj.y += proj.vy * seconds;
      if (proj.x < 24 || proj.x > WORLD_WIDTH - 24 || proj.y < 24 || proj.y > WORLD_HEIGHT - 24) return false;
      if (collidesWithBlocker(proj.x, proj.y, currentRoom, 4)) return false;
      if (Math.hypot(proj.x - player.x, proj.y - player.y) < PLAYER_RADIUS + 6 && player.invulnerableMs <= 0) {
        resolveIncomingDamage(proj.damage, proj.x, proj.y, "HARMONIC IMPACT!");
        return false;
      }
      return true;
    });
  
    const newDeaths = enemies.filter((enemy, index) => enemy.health <= 0 && state.enemies[index].health > 0);
    for (const enemy of newDeaths) {
      const isBoss = enemy.kind === "boss";
      kills += 1;
      hitstopMs = isBoss ? 95 : 32;
      shakeMs = Math.max(shakeMs, isBoss ? 340 : 155);
      lastKillSound = { isBoss, seq: (lastKillSound?.seq ?? 0) + 1 };
  
      const burstColors = isBoss
        ? [enemy.bossSpec?.primaryColor ?? "#ffcf56", enemy.bossSpec?.glowColor ?? "#ffffff", "#6fe3c1", "#ffffff"]
        : enemy.kind === "duelist"
          ? ["#d18ce8", "#f0a8ff", "#ffffff"]
          : enemy.kind === "arcanist"
            ? ["#63d2ff", "#a8f0ff", "#ffffff"]
            : ["#ff8c5a", "#ffcf56", "#ffffff"];
      spawnBurstParticles(enemy.x, enemy.y, burstColors, isBoss ? 32 : 16, isBoss ? 1.4 : 1.05);
  
      const xpGain = isBoss ? 250 + floor * 18 : enemy.kind === "bulwark" ? 48 + floor * 2 : 30 + Math.floor(floor * 1.6);
      score += isBoss ? 850 + floor * 30 : 140 + floor * 4;
      player.xp += xpGain;
      pushPopup(enemy.x, enemy.y - 6, `+${xpGain} XP`, "#f5d469");
  
      const totalGold = isBoss ? 160 + floor * 22 : 18 + floor * 5 + Math.floor(Math.random() * 14);
      const coinStacks = isBoss ? 5 : 2;
      const perCoin = Math.max(1, Math.round(totalGold / coinStacks));
      for (let c = 0; c < coinStacks; c++) {
        const ang = ((Math.PI * 2) / coinStacks) * c + Math.random() * 0.6;
        const spd = 48 + Math.random() * 48;
        pickups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y, z: 10, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.7, vz: 95 + Math.random() * 55, goldAmount: c === 0 ? totalGold - perCoin * (coinStacks - 1) : perCoin });
      }
  
      if (Math.random() < (isBoss ? 1.0 : 0.34)) {
        const dAmount = isBoss ? 5 + Math.floor(floor / 10) : 1;
        const gemCount = isBoss ? 3 : 1;
        const perGem = Math.max(1, Math.round(dAmount / gemCount));
        for (let d = 0; d < gemCount; d++) {
          const dAng = Math.random() * Math.PI * 2;
          const dSpd = 52 + Math.random() * 45;
          pickups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y, z: 12, vx: Math.cos(dAng) * dSpd, vy: Math.sin(dAng) * dSpd * 0.7, vz: 110 + Math.random() * 50, diamondAmount: d === 0 ? dAmount - perGem * (gemCount - 1) : perGem });
        }
      }
  
      while (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;
        player.level += 1;
        player.xpToNext = Math.round(player.xpToNext * 1.26);
        const gained: string[] = [];
        for (let p = 0; p < 2; p++) {
          const roll = Math.floor(Math.random() * 3);
          if (roll === 0) { player.stats.damagePoints += 1; gained.push("+1 DMG"); }
          else if (roll === 1) { player.stats.healthPoints += 1; gained.push("+1 HP"); }
          else { player.stats.agilityPoints += 1; gained.push("+1 AGI"); }
        }
        const refreshed = computePlayerMaxStats(player.level, player.stats, equippedGear, profile.slotUpgradeLevels);
        player.maxHealth = refreshed.maxHealth;
        player.health = player.maxHealth;
        player.maxStamina = refreshed.maxStamina;
        player.stamina = player.maxStamina;
        pushPopup(player.x, player.y - 12, `LEVEL UP LV.${player.level}!`, "#79f2cc");
        message = "LEVEL UP LV." + player.level + " (" + gained.join(" · ") + ")";
      }
  
      if (isBoss) {
        const bossLoot = makeGear(floor, undefined, floor >= 50 ? "Legendary" : "Epic");
        pickups.push({ id: enemy.id * 1000 + nextEntityId++, x: enemy.x, y: enemy.y, z: 14, vx: 0, vy: 22, vz: 110, item: bossLoot });
        if (!profile.unlockedSignalLinks.includes(floor)) {
          profile.unlockedSignalLinks.push(floor);
          profile.unlockedSignalLinks.sort((a, b) => a - b);
        }
        const matchingTape = SIGNAL_TAPES_DB.find((t) => t.floorFound === floor) ?? SIGNAL_TAPES_DB.find((t) => t.floorFound <= floor && !profile.decodedTapes.includes(t.id)) ?? null;
        if (matchingTape && !profile.decodedTapes.includes(matchingTape.id)) profile.decodedTapes.push(matchingTape.id);
        const spec = enemy.bossSpec ?? getBossSpecForFloor(floor);
        const bossEvt: BossEvent = { bossFloor: floor, bossName: spec.name, bossTitle: spec.title, abilityLabel: spec.abilityLabel, subtitle: `${spec.name} SHATTERED · SIGNAL LINK F${floor} LOCKED`, unlockedLink: floor, bossSpec: spec, loreTape: matchingTape, timestamp: Date.now() };
        lastBossEvent = bossEvt;
        pendingBossLore = bossEvt;
        message = bossEvt.subtitle;
      } else if (Math.random() < 0.38) {
        const loot = makeGear(floor);
        pickups.push({ id: enemy.id * 1000 + nextEntityId++, x: enemy.x, y: enemy.y, z: 10, vx: (Math.random() - 0.5) * 45, vy: -22, vz: 90, item: loot });
      }
    }
    const allEnemiesDead = enemies.every((enemy) => enemy.health <= 0);
  const collected: LootPickup[] = [];
  pickups = pickups.filter((pickup) => {
    pickup.x = clamp(pickup.x + pickup.vx * seconds, 30, WORLD_WIDTH - 30);
    pickup.y = clamp(pickup.y + pickup.vy * seconds, 30, WORLD_HEIGHT - 30);
    pickup.vx *= 0.9;
    pickup.vy *= 0.9;

    if (pickup.z > 0 || pickup.vz !== 0) {
      pickup.z += pickup.vz * seconds;
      pickup.vz -= 420 * seconds;
      if (pickup.z <= 0) {
        pickup.z = 0;
        pickup.vz = Math.abs(pickup.vz) > 26 ? -pickup.vz * 0.48 : 0;
      }
    }

    const dist = Math.hypot(pickup.x - player.x, pickup.y - player.y);
    const magnetRange = allEnemiesDead ? 999 : 145;
    if (dist < magnetRange) {
      const pull = normalized(player.x - pickup.x, player.y - pickup.y);
      const pullSpeed = allEnemiesDead ? 340 : 250 + (145 - dist) * 2.2;
      pickup.x += pull.x * pullSpeed * seconds;
      pickup.y += pull.y * pullSpeed * seconds;
    }

    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) > 34) return true;
    collected.push(pickup);
    return false;
  });

  for (const pickup of collected) {
    if (pickup.goldAmount) {
      carriedGold += pickup.goldAmount;
      lastPickupSound = { kind: "gold", seq: (lastPickupSound?.seq ?? 0) + 1 };
      pushPopup(player.x, player.y, `+${pickup.goldAmount}G`, "#ffcf4d");
      continue;
    }
    if (pickup.diamondAmount) {
      carriedDiamonds += pickup.diamondAmount;
      lastPickupSound = { kind: "diamond", seq: (lastPickupSound?.seq ?? 0) + 1 };
      pushPopup(player.x, player.y, `+${pickup.diamondAmount} GEM`, "#5ec8ff");
      continue;
    }
    if (pickup.tapeId) {
      if (!carriedTapes.includes(pickup.tapeId)) {
        carriedTapes.push(pickup.tapeId);
        lastPickupSound = { kind: "gear", seq: (lastPickupSound?.seq ?? 0) + 1 };
        pushPopup(player.x, player.y, "SIGNAL TAPE!", "#ffcf56");
      }
      continue;
    }
    if (!pickup.item) continue;
    lastPickupSound = { kind: "gear", seq: (lastPickupSound?.seq ?? 0) + 1 };
    if (!profile.discoveredItems.includes(pickup.item.baseKey)) profile.discoveredItems.push(pickup.item.baseKey);
    carriedGear = stackGearList([...carriedGear, pickup.item]);
    if (!equippedGear[pickup.item.slot]) {
      equippedGear[pickup.item.slot] = { ...pickup.item, count: 1 };
      const refreshed = computePlayerMaxStats(player.level, player.stats, equippedGear, profile.slotUpgradeLevels);
      player.maxHealth = refreshed.maxHealth;
      player.maxStamina = refreshed.maxStamina;
      message = "EQUIPPED: " + pickup.item.name + " (" + pickup.item.rarity + ")";
    } else {
      message = "LOOTED: " + pickup.item.name + " (" + pickup.item.rarity + ")";
    }
    pushPopup(player.x, player.y, `+1 ${pickup.item.name}`, "#8ae8ff");
    score += RARITY_RANK[pickup.item.rarity] * 35;
  }

  if (player.health <= 0) {
    status = "defeated";
    lostGearCount = carriedGear.reduce((acc, g) => acc + g.count, 0) + carriedTapes.length;
    carriedGear = [];
    carriedTapes = [];
    carriedGold = 0;
    carriedDiamonds = 0;
    profile = { ...profile, level: player.level, xp: player.xp, xpToNext: player.xpToNext, stats: { ...player.stats }, deepestFloor: Math.max(profile.deepestFloor, floor) };
    message = "SIGNAL LOST ON FLOOR " + floor + " · UNBANKED HAUL WIPED";
  } else if (!roomCleared && allEnemiesDead) {
    roomCleared = true;
    if (currentRoom.isFinalBoss && !state.overdriveMode) {
      status = "victory-ending";
      message = "FLOOR 100 SOVEREIGN SHATTERED · SIGNAL DECODED!";
    } else {
      message = "FLOOR " + floor + " CLEAR · STEP INTO THE RIGHT EXTRACTION LIFT";
    }
  }

  const exitDistance = Math.hypot(WORLD_WIDTH - 58 - player.x, WORLD_HEIGHT / 2 - player.y);
  if (status === "playing" && roomCleared && exitDistance < 76) {
    for (const pickup of pickups) {
      if (pickup.goldAmount) carriedGold += pickup.goldAmount;
      else if (pickup.diamondAmount) carriedDiamonds += pickup.diamondAmount;
      else if (pickup.tapeId && !carriedTapes.includes(pickup.tapeId)) carriedTapes.push(pickup.tapeId);
      else if (pickup.item) {
        if (!profile.discoveredItems.includes(pickup.item.baseKey)) profile.discoveredItems.push(pickup.item.baseKey);
        carriedGear = stackGearList([...carriedGear, pickup.item]);
        if (!equippedGear[pickup.item.slot]) equippedGear[pickup.item.slot] = { ...pickup.item, count: 1 };
        score += RARITY_RANK[pickup.item.rarity] * 35;
      }
    }
    pickups = [];

    if (pendingBossLore) {
      status = "boss-lore";
      message = `TRANSMISSION DECODED // ${pendingBossLore.bossName}`;
    } else if (!currentRoom.isFinalBoss && Math.random() < 0.34) {
      status = "shop";
      shopOffers = generateDiamondShopOffers(floor);
      message = "SUBTERRANEAN DIAMOND MERCHANT DISCOVERED!";
    } else {
      status = "floor-clear";
      message = "FLOOR " + floor + " LIFT READY · EXTRACT OR DESCEND";
    }
  }

  return {
    ...state,
    status,
    currentRoom,
    profile,
    player,
    enemies,
    projectiles,
    combatPopups,
    particles,
    hitstopMs,
    shakeMs,
    lastHitSound,
    lastKillSound,
    lastPickupSound,
    pickups,
    carriedGear,
    carriedTapes,
    carriedGold,
    carriedDiamonds,
    shopOffers,
    equippedGear,
    kills,
    score,
    damageBlocked,
    roomCleared,
    lostGearCount,
    lastBossEvent,
    pendingBossLore,
    message,
    attackWasDown: input.attack,
    dodgeWasDown: input.dodge,
    interactWasDown: input.interact,
  };
}

export function acknowledgeBossLore(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "boss-lore") return state;
  const floor = state.roomIndex + 1;
  if (!state.currentRoom.isFinalBoss && Math.random() < 0.4) {
    return { ...state, status: "shop", pendingBossLore: null, shopOffers: generateDiamondShopOffers(floor), message: "SUBTERRANEAN DIAMOND MERCHANT DISCOVERED!" };
  }
  return { ...state, status: "floor-clear", pendingBossLore: null, message: "FLOOR " + floor + " LIFT READY · EXTRACT OR DESCEND" };
}

function advanceToFloor(state: DeepSignalRun, nextRoomIndex: number): DeepSignalRun {
  const nextRoom = generateProceduralRoom(nextRoomIndex);
  const nextFloor = nextRoomIndex + 1;
  return {
    ...state,
    status: "playing",
    roomIndex: nextRoomIndex,
    currentRoom: nextRoom,
    player: { ...state.player, x: 74, y: WORLD_HEIGHT / 2, vx: 0, vy: 0, stamina: state.player.maxStamina, guarding: false, invulnerableMs: 350 },
    enemies: createEnemiesForRoom(nextRoomIndex, nextRoom),
    projectiles: [],
    combatPopups: [],
    particles: [],
    pickups: [],
    shopOffers: [],
    roomCleared: false,
    pendingBossLore: null,
    attackWasDown: false,
    interactWasDown: false,
    message: nextRoom.isFinalBoss ? "FLOOR 100 · DEFEAT THE SIGNAL SOVEREIGN" : nextRoom.bossSpec ? `FLOOR ${nextFloor} GUARDIAN · ${nextRoom.bossSpec.name}` : "FLOOR " + nextFloor + " · " + nextRoom.biome.name,
  };
}

export function descendToNextFloor(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "floor-clear" && state.status !== "shop") return state;
  return advanceToFloor(state, state.roomIndex + 1);
}

export function continueOverdriveAfterEnding(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "victory-ending") return state;
  return advanceToFloor({ ...state, overdriveMode: true }, state.roomIndex + 1);
}

export function buyDiamondShopOffer(state: DeepSignalRun, offerId: string): DeepSignalRun {
  if (state.status !== "shop") return state;
  const offer = state.shopOffers.find((o) => o.id === offerId);
  if (!offer || offer.purchased || state.profile.diamonds + state.carriedDiamonds < offer.diamondCost) return state;

  let remainingCost = offer.diamondCost;
  const fromCarried = Math.min(state.carriedDiamonds, remainingCost);
  const nextCarriedDiamonds = state.carriedDiamonds - fromCarried;
  remainingCost -= fromCarried;
  const nextBankDiamonds = state.profile.diamonds - remainingCost;

  const nextPlayer = { ...state.player };
  let nextCarriedGear = [...state.carriedGear];
  const nextDiscovered = [...state.profile.discoveredItems];
  const floor = state.roomIndex + 1;
  let purchasedLabel = offer.label.toUpperCase();

  if (offer.kind === "stim") {
    nextPlayer.health = nextPlayer.maxHealth;
    nextPlayer.stamina = nextPlayer.maxStamina;
  } else if (offer.kind === "mystery") {
    const rolledItem = makeGear(floor + 2);
    if (!nextDiscovered.includes(rolledItem.baseKey)) nextDiscovered.push(rolledItem.baseKey);
    nextCarriedGear = stackGearList([...nextCarriedGear, rolledItem]);
    purchasedLabel = `${rolledItem.name.toUpperCase()} (${rolledItem.rarity.toUpperCase()})`;
  } else if (offer.kind === "gear" && offer.item) {
    if (!nextDiscovered.includes(offer.item.baseKey)) nextDiscovered.push(offer.item.baseKey);
    nextCarriedGear = stackGearList([...nextCarriedGear, offer.item]);
  }

  return {
    ...state,
    profile: { ...state.profile, diamonds: nextBankDiamonds, discoveredItems: nextDiscovered },
    carriedDiamonds: nextCarriedDiamonds,
    carriedGear: nextCarriedGear,
    player: nextPlayer,
    shopOffers: state.shopOffers.map((o) => (o.id === offerId ? { ...o, purchased: true } : o)),
    message: `PURCHASED ${purchasedLabel} FOR ${offer.diamondCost} DIAMONDS!`,
  };
}
export function extractWithLoot(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "floor-clear" && state.status !== "shop" && state.status !== "victory-ending" && state.status !== "boss-lore") return state;
  const floor = state.roomIndex + 1;
  const unlockedSkins = [...state.profile.unlockedSkins];
  if (floor >= 20 && !unlockedSkins.includes("cryo-surveyor")) unlockedSkins.push("cryo-surveyor");
  if (floor >= 50 && !unlockedSkins.includes("void-walker")) unlockedSkins.push("void-walker");
  if (floor >= 100 && !unlockedSkins.includes("sovereign-gold")) unlockedSkins.push("sovereign-gold");

  const updatedProfile: SurveyorProfile = {
    ...state.profile,
    level: state.player.level,
    xp: state.player.xp,
    xpToNext: state.player.xpToNext,
    gold: state.profile.gold + state.carriedGold,
    diamonds: state.profile.diamonds + state.carriedDiamonds,
    stats: { ...state.player.stats },
    bankedGear: stackGearList([...state.profile.bankedGear, ...state.carriedGear]),
    equippedGear: { ...state.equippedGear },
    decodedTapes: Array.from(new Set([...state.profile.decodedTapes, ...state.carriedTapes])),
    unlockedSkins,
    deepestFloor: Math.max(state.profile.deepestFloor, floor),
    totalExtractions: state.profile.totalExtractions + 1,
  };

  return {
    ...state,
    status: "escaped",
    profile: updatedProfile,
    equippedGear: { ...updatedProfile.equippedGear },
    carriedGear: [],
    carriedTapes: [],
    carriedGold: 0,
    carriedDiamonds: 0,
    shopOffers: [],
    pendingBossLore: null,
    message: "EXTRACTED SAFELY · GOLD, DIAMONDS & LOOT BANKED",
  };
}

export function equipFromBankToSlot(profile: SurveyorProfile, bankItemId: string, targetSlot?: GearSlot): SurveyorProfile {
  const index = profile.bankedGear.findIndex((g) => g.id === bankItemId);
  if (index === -1) return profile;
  const sourceItem = profile.bankedGear.at(index)!;
  if (targetSlot && sourceItem.slot !== targetSlot) return profile;

  const slot = sourceItem.slot;
  const previousEquipped = profile.equippedGear[slot];
  const nextBank: GearItem[] = [];
  for (let i = 0; i < profile.bankedGear.length; i++) {
    const entry = profile.bankedGear.at(i)!;
    if (i === index) {
      if (entry.count > 1) nextBank.push({ ...entry, count: entry.count - 1 });
    } else {
      nextBank.push({ ...entry });
    }
  }
  if (previousEquipped) nextBank.push({ ...previousEquipped, count: 1 });

  return {
    ...profile,
    bankedGear: stackGearList(nextBank),
    equippedGear: { ...profile.equippedGear, [slot]: { ...sourceItem, count: 1 } },
  };
}

export function unequipSlotToBank(profile: SurveyorProfile, slot: GearSlot): SurveyorProfile {
  const current = profile.equippedGear[slot];
  if (!current || profile.bankedGear.length >= MAX_INVENTORY_SLOTS) return profile;
  const nextEquipped: EquippedGearMap = { ...profile.equippedGear };
  delete nextEquipped[slot];
  return { ...profile, bankedGear: stackGearList([...profile.bankedGear, { ...current, count: 1 }]), equippedGear: nextEquipped };
}

export function unequipAllSlotsToBank(profile: SurveyorProfile): SurveyorProfile {
  let working = { ...profile, bankedGear: [...profile.bankedGear], equippedGear: { ...profile.equippedGear } };
  for (const slot of ALL_GEAR_SLOTS) {
    if (working.equippedGear[slot]) working = unequipSlotToBank(working, slot);
  }
  return working;
}

function getItemScore(item: GearItem, slotLevel = 1): number {
  const eff = getEffectiveGearStats(item, slotLevel);
  return eff.attack * 3 + eff.health * 0.6 + eff.guard * 0.7 + eff.agility * 2.5 + RARITY_RANK[item.rarity] * 10;
}

export function equipBestGearFromBank(profile: SurveyorProfile): SurveyorProfile {
  let working = { ...profile, bankedGear: [...profile.bankedGear], equippedGear: { ...profile.equippedGear } };
  for (const slot of ALL_GEAR_SLOTS) {
    const slotLv = working.slotUpgradeLevels[slot] ?? 1;
    const current = working.equippedGear[slot];
    let bestCandidate: GearItem | null = null;
    let bestScore = current ? getItemScore(current, slotLv) : -1;
    for (const item of working.bankedGear) {
      if (item.slot !== slot) continue;
      const sc = getItemScore(item, slotLv);
      if (sc > bestScore) { bestScore = sc; bestCandidate = item; }
    }
    if (bestCandidate) working = equipFromBankToSlot(working, bestCandidate.id, slot);
  }
  return working;
}

export function setSurveyorSkin(profile: SurveyorProfile, skinId: string): SurveyorProfile {
  return profile.unlockedSkins.includes(skinId) ? { ...profile, activeSkin: skinId } : profile;
}

export function getSlotUpgradeCost(currentSlotLevel: number): number {
  return Math.round(45 + currentSlotLevel * 28 + Math.pow(currentSlotLevel, 1.45) * 6);
}

export function getMultiSlotUpgradePlan(gold: number, currentSlotLevel: number, desiredLevels: number | "MAX") {
  let lv = currentSlotLevel;
  let totalCost = 0;
  let levelsToBuy = 0;
  const maxStep = desiredLevels === "MAX" ? MAX_SLOT_UPGRADE_LEVEL - currentSlotLevel : desiredLevels;
  while (levelsToBuy < maxStep && lv < MAX_SLOT_UPGRADE_LEVEL) {
    const stepCost = getSlotUpgradeCost(lv);
    if (totalCost + stepCost > gold) break;
    totalCost += stepCost;
    lv += 1;
    levelsToBuy += 1;
  }
  return { levelsToBuy, totalCost };
}

export function upgradeEquippedSlotBulkWithGold(profile: SurveyorProfile, slot: GearSlot, desiredLevels: number | "MAX"): SurveyorProfile {
  const currentLv = profile.slotUpgradeLevels[slot] ?? 1;
  const plan = getMultiSlotUpgradePlan(profile.gold, currentLv, desiredLevels);
  if (plan.levelsToBuy <= 0 || profile.gold < plan.totalCost) return profile;
  return {
    ...profile,
    gold: profile.gold - plan.totalCost,
    slotUpgradeLevels: { ...profile.slotUpgradeLevels, [slot]: currentLv + plan.levelsToBuy },
  };
}

export function upgradeEquippedSlotWithGold(profile: SurveyorProfile, slot: GearSlot): SurveyorProfile {
  return upgradeEquippedSlotBulkWithGold(profile, slot, 1);
}

export function getBaseCopiesEquivalent(ascensionRank: number): number {
  return Math.pow(ASCENSION_MERGE_COUNT, Math.max(0, ascensionRank));
}

export function fuseGearStackInVault(profile: SurveyorProfile, bankItemId: string) {
  const target = profile.bankedGear.find((g) => g.id === bankItemId);
  if (!target || target.count < ASCENSION_MERGE_COUNT) return { profile, result: null };
  const nextRank = target.ascensionRank + 1;
  const upgradedStackItem: GearItem = { ...target, id: "gear-asc-" + Date.now().toString(36) + "-" + nextEntityId++, count: 1, ascensionRank: nextRank };
  const nextBank: GearItem[] = [];
  for (const entry of profile.bankedGear) {
    if (entry.id === bankItemId) {
      if (entry.count > ASCENSION_MERGE_COUNT) nextBank.push({ ...entry, count: entry.count - ASCENSION_MERGE_COUNT });
    } else {
      nextBank.push({ ...entry });
    }
  }
  nextBank.push(upgradedStackItem);
  return { profile: { ...profile, bankedGear: stackGearList(nextBank) }, result: { itemName: target.name, newRank: nextRank, copiesUsed: ASCENSION_MERGE_COUNT } };
}

export function fuseEquippedWithVaultCopies(profile: SurveyorProfile, slot: GearSlot) {
  const equipped = profile.equippedGear[slot];
  if (!equipped) return { profile, result: null };
  const neededFromVault = ASCENSION_MERGE_COUNT - 1;
  const matchingStack = profile.bankedGear.find((g) => g.slot === equipped.slot && g.baseKey === equipped.baseKey && g.rarity === equipped.rarity && g.ascensionRank === equipped.ascensionRank && g.count >= neededFromVault);
  if (!matchingStack) return { profile, result: null };
  const nextRank = equipped.ascensionRank + 1;
  const nextBank: GearItem[] = [];
  for (const entry of profile.bankedGear) {
    if (entry.id === matchingStack.id) {
      if (entry.count > neededFromVault) nextBank.push({ ...entry, count: entry.count - neededFromVault });
    } else {
      nextBank.push({ ...entry });
    }
  }
  return {
    profile: { ...profile, bankedGear: stackGearList(nextBank), equippedGear: { ...profile.equippedGear, [slot]: { ...equipped, ascensionRank: nextRank } } },
    result: { itemName: equipped.name, newRank: nextRank, copiesUsed: ASCENSION_MERGE_COUNT },
  };
}

export function getItemSellValue(item: GearItem): number {
  const rarityBase = RARITY_RANK[item.rarity] * 14;
  const rankMult = Math.pow(2.4, Math.max(0, item.ascensionRank));
  return Math.max(5, Math.round((rarityBase + item.power * 2) * rankMult));
}

export function sellBankItemStack(profile: SurveyorProfile, bankItemId: string, sellAllInStack = false) {
  const target = profile.bankedGear.find((g) => g.id === bankItemId);
  if (!target) return { profile, goldEarned: 0, soldCount: 0 };
  const qtyToSell = sellAllInStack ? target.count : 1;
  const goldEarned = getItemSellValue(target) * qtyToSell;
  const nextBank: GearItem[] = [];
  for (const entry of profile.bankedGear) {
    if (entry.id === bankItemId) {
      if (entry.count > qtyToSell) nextBank.push({ ...entry, count: entry.count - qtyToSell });
    } else {
      nextBank.push({ ...entry });
    }
  }
  return { profile: { ...profile, gold: profile.gold + goldEarned, bankedGear: stackGearList(nextBank) }, goldEarned, soldCount: qtyToSell };
}

export function sellFilteredBankItems(profile: SurveyorProfile, rarityFilter: GearRarity | "all", slotFilter: GearSlot | "all") {
  let goldEarned = 0;
  let soldCount = 0;
  const kept: GearItem[] = [];
  for (const entry of profile.bankedGear) {
    const matchesRarity = rarityFilter === "all" || entry.rarity === rarityFilter;
    const matchesSlot = slotFilter === "all" || entry.slot === slotFilter;
    if (matchesRarity && matchesSlot && entry.ascensionRank === 0) {
      goldEarned += getItemSellValue(entry) * entry.count;
      soldCount += entry.count;
    } else {
      kept.push(entry);
    }
  }
  if (soldCount === 0) return { profile, goldEarned: 0, soldCount: 0 };
  return { profile: { ...profile, gold: profile.gold + goldEarned, bankedGear: stackGearList(kept) }, goldEarned, soldCount };
}
