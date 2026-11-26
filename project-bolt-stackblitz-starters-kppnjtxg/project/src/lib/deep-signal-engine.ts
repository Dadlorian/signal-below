import {
  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  MAX_SLOT_UPGRADE_LEVEL,
  createDefaultSurveyorProfile,
  stackGearList,
  type EnemyCombatRecord,
  type EquippedGearMap,
  type GearItem,
  type GearRarity,
  type GearSlot,
  type SlotUpgradeMap,
  type SurveyorProfile,
  type SurveyorStats,
  type WeaponArchetype,
} from "./deep-signal-store";
import { getSkinTheme } from "./Pixel-skins";

export {

  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  MAX_SLOT_UPGRADE_LEVEL,
  type EnemyCombatRecord,
  type EquippedGearMap,
  type GearItem,
  type GearRarity,
  type GearSlot,
  type SlotUpgradeMap,
  type SurveyorProfile,
  type SurveyorStats,
  type WeaponArchetype,
};

export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 400;
export const PLAYER_RADIUS = 13;
export const CHARGE_FULL_MS = 900; // Hold attack 0.9s for 2x Charge Cleave

export type BiomeId =
  | "outside-warehouse"
  | "outer-bunker"
  | "science-labs"
  | "cpu-towers"
  | "archives"
  | "coolant-conduits"
  | "thermal-core"
  | "barracks"
  | "refinery"
  | "armory"
  | "vault-antechamber"
  | "signal-core";

export type BiomeDefinition = {
  id: BiomeId;
  sectorNumber: number;
  name: string;
  minFloor: number;
  maxFloor: number;
  floorRangeLabel: string;
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
    id: "outside-warehouse",
    sectorNumber: 0,
    name: "WAREHOUSE TRAINING YARD",
    minFloor: 0,
    maxFloor: 0,
    floorRangeLabel: "SECTOR 0 · TRAINING",
    floorColor: "#383530",
    gridColor: "#2b2824",
    wallColor: "#4a5659",
    trimColor: "#75654e",
    accentColor: "#ffcf56",
    voidTopColor: "#141c1e",
    voidBottomColor: "#222624",
    ambientNote: "Surface BTC Shipping Warehouse. Practice slashes, 2X charges, dashes, and parries before entering the cave.",
  },
  {
    id: "outer-bunker",
    sectorNumber: 1,
    name: "OUTER BUNKER",
    minFloor: 1,
    maxFloor: 10,
    floorRangeLabel: "FLOORS 01–10",
    floorColor: "#192622",
    gridColor: "#131e1b",
    wallColor: "#22342f",
    trimColor: "#38524a",
    accentColor: "#6fe3c1",
    voidTopColor: "#060b0a",
    voidBottomColor: "#0c1513",
    ambientNote: "Concrete security perimeter sealed during the Bright Tomorrows evacuation.",
  },
  {
    id: "science-labs",
    sectorNumber: 2,
    name: "SCIENCE LABS",
    minFloor: 11,
    maxFloor: 20,
    floorRangeLabel: "FLOORS 11–20",
    floorColor: "#16261d",
    gridColor: "#101d16",
    wallColor: "#1f3829",
    trimColor: "#365e45",
    accentColor: "#80eb28",
    voidTopColor: "#060c08",
    voidBottomColor: "#0b1710",
    ambientNote: "Mutagenic containment vats & shattered cryo-glass under Head Scientist Elijah.",
  },
  {
    id: "cpu-towers",
    sectorNumber: 3,
    name: "CPU TOWERS",
    minFloor: 21,
    maxFloor: 30,
    floorRangeLabel: "FLOORS 21–30",
    floorColor: "#151e30",
    gridColor: "#101726",
    wallColor: "#1d2b47",
    trimColor: "#30497a",
    accentColor: "#63b3ff",
    voidTopColor: "#050812",
    voidBottomColor: "#0a1121",
    ambientNote: "Monolithic mainframe cooling spires humming with carrier-wave relays.",
  },
  {
    id: "archives",
    sectorNumber: 4,
    name: "THE ARCHIVES",
    minFloor: 31,
    maxFloor: 40,
    floorRangeLabel: "FLOORS 31–40",
    floorColor: "#1e162b",
    gridColor: "#171121",
    wallColor: "#2c2040",
    trimColor: "#4b366e",
    accentColor: "#d4a8ff",
    voidTopColor: "#08050f",
    voidBottomColor: "#110b1c",
    ambientNote: "Subterranean magnetic tape vaults guarded by Archivist Null.",
  },
  {
    id: "coolant-conduits",
    sectorNumber: 5,
    name: "COOLANT CONDUITS",
    minFloor: 41,
    maxFloor: 50,
    floorRangeLabel: "FLOORS 41–50",
    floorColor: "#14242b",
    gridColor: "#0f1c22",
    wallColor: "#1d3540",
    trimColor: "#31586b",
    accentColor: "#7ce8ff",
    voidTopColor: "#050a0d",
    voidBottomColor: "#0b151a",
    ambientNote: "Frost-crusted liquid-nitrogen pipelines feeding the lower reactors.",
  },
  {
    id: "thermal-core",
    sectorNumber: 6,
    name: "THERMAL CORE",
    minFloor: 51,
    maxFloor: 60,
    floorRangeLabel: "FLOORS 51–60",
    floorColor: "#291814",
    gridColor: "#21120f",
    wallColor: "#3d221c",
    trimColor: "#6b392e",
    accentColor: "#ff7a45",
    voidTopColor: "#0d0605",
    voidBottomColor: "#1a0c0a",
    ambientNote: "Geothermal magma vents superheating the Complex's central turbines.",
  },
  {
    id: "barracks",
    sectorNumber: 7,
    name: "SECURITY BARRACKS",
    minFloor: 61,
    maxFloor: 70,
    floorRangeLabel: "FLOORS 61–70",
    floorColor: "#182420",
    gridColor: "#121c19",
    wallColor: "#233630",
    trimColor: "#3b5950",
    accentColor: "#9ee6cf",
    voidTopColor: "#060a09",
    voidBottomColor: "#0d1412",
    ambientNote: "Living quarters and tactical armories of BTC's subterranean garrison.",
  },
  {
    id: "refinery",
    sectorNumber: 8,
    name: "ALLOY REFINERY",
    minFloor: 71,
    maxFloor: 80,
    floorRangeLabel: "FLOORS 71–80",
    floorColor: "#262015",
    gridColor: "#1e1910",
    wallColor: "#382f1e",
    trimColor: "#615133",
    accentColor: "#f5c76e",
    voidTopColor: "#0c0905",
    voidBottomColor: "#17120a",
    ambientNote: "Automated smelting crucibles forging deep-earth conductive alloys.",
  },
  {
    id: "armory",
    sectorNumber: 9,
    name: "EXECUTIONER ARMORY",
    minFloor: 81,
    maxFloor: 90,
    floorRangeLabel: "FLOORS 81–90",
    floorColor: "#24191e",
    gridColor: "#1c1317",
    wallColor: "#36242c",
    trimColor: "#5e3d4b",
    accentColor: "#ff8fb8",
    voidTopColor: "#0b0608",
    voidBottomColor: "#140c10",
    ambientNote: "High-security prototype weapons cache locked behind biometric bulkheads.",
  },
  {
    id: "vault-antechamber",
    sectorNumber: 10,
    name: "VAULT ANTECHAMBER",
    minFloor: 91,
    maxFloor: 99,
    floorRangeLabel: "FLOORS 91–99",
    floorColor: "#241f14",
    gridColor: "#1c180f",
    wallColor: "#362e1d",
    trimColor: "#635434",
    accentColor: "#ffe680",
    voidTopColor: "#0b0905",
    voidBottomColor: "#141109",
    ambientNote: "Gilded resonance corridor leading directly into the Signal Sovereign's chamber.",
  },
  {
    id: "signal-core",
    sectorNumber: 11,
    name: "THE SIGNAL CORE",
    minFloor: 100,
    maxFloor: 9999,
    floorRangeLabel: "FLOOR 100+",
    floorColor: "#26141b",
    gridColor: "#1d0f15",
    wallColor: "#3b1d29",
    trimColor: "#6b3248",
    accentColor: "#ff477e",
    voidTopColor: "#0d0508",
    voidBottomColor: "#17090f",
    ambientNote: "Origin point of the subterranean carrier broadcast.",
  },
];

export type BossArchetypeId =
  | "warden-10"
  | "riot-20"
  | "matriarch-30"
  | "archivist-40"
  | "cryo-50"
  | "thermal-60"
  | "vanguard-70"
  | "smelter-80"
  | "armory-90"
  | "sovereign-100"
  | "overdrive-apex";

export type BossSpec = {
  archetype: BossArchetypeId;
  floor: number;
  name: string;
  title: string;
  abilityLabel: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
};

export const BOSS_ROSTER: BossSpec[] = [
  {
    archetype: "warden-10",
    floor: 10,
    name: "VANCE-01",
    title: "IRON WARDEN",
    abilityLabel: "SHOCKWAVE SLASH",
    primaryColor: "#e62e2e",
    secondaryColor: "#9c1414",
    glowColor: "#ffcf56",
  },
  {
    archetype: "riot-20",
    floor: 20,
    name: "E1-IJ-4H",
    title: "RIOT ARCHITECT",
    abilityLabel: "TOXIC TRI-BOLT",
    primaryColor: "#80eb28",
    secondaryColor: "#227a26",
    glowColor: "#d8ff9e",
  },
  {
    archetype: "matriarch-30",
    floor: 30,
    name: "FLYER MATRIARCH",
    title: "BROOD MOTHER",
    abilityLabel: "BROOD SWARM",
    primaryColor: "#3a66f2",
    secondaryColor: "#1c389e",
    glowColor: "#80e8ff",
  },
  {
    archetype: "archivist-40",
    floor: 40,
    name: "ARCHIVIST NULL",
    title: "MEMORY KEEPER",
    abilityLabel: "PHASE NOVA",
    primaryColor: "#8028eb",
    secondaryColor: "#4b148f",
    glowColor: "#f238ff",
  },
  {
    archetype: "cryo-50",
    floor: 50,
    name: "CRYO SENTINEL",
    title: "ZERO-POINT WARD",
    abilityLabel: "GLACIAL RING",
    primaryColor: "#2da8ff",
    secondaryColor: "#1565a8",
    glowColor: "#e8f9ff",
  },
  {
    archetype: "thermal-60",
    floor: 60,
    name: "THERMAL TITAN",
    title: "FURNACE COLOSSUS",
    abilityLabel: "MAGMA SHELL",
    primaryColor: "#e62e2e",
    secondaryColor: "#8f1111",
    glowColor: "#ff7a45",
  },
  {
    archetype: "vanguard-70",
    floor: 70,
    name: "COMMANDER KRELL",
    title: "BARRACKS MARSHAL",
    abilityLabel: "PHALANX VOLLEY",
    primaryColor: "#3b8c73",
    secondaryColor: "#174a3a",
    glowColor: "#9ee6cf",
  },
  {
    archetype: "smelter-80",
    floor: 80,
    name: "FORGE OVERSEER",
    title: "CRUCIBLE WARDEN",
    abilityLabel: "SLAG ERUPTION",
    primaryColor: "#d4941c",
    secondaryColor: "#6e4706",
    glowColor: "#ffe082",
  },
  {
    archetype: "armory-90",
    floor: 90,
    name: "AEGIS PRIME",
    title: "VAULT SENTINEL",
    abilityLabel: "EXECUTIONER RING",
    primaryColor: "#d94878",
    secondaryColor: "#691934",
    glowColor: "#ff9ec0",
  },
  {
    archetype: "sovereign-100",
    floor: 100,
    name: "SIGNAL SOVEREIGN",
    title: "ARCHITECT OF THE CORE",
    abilityLabel: "CARRIER BARRAGE",
    primaryColor: "#ffcf33",
    secondaryColor: "#996a08",
    glowColor: "#fffbe0",
  },
];

export const FINAL_BOSS_FLOOR = 100;

export function getBiomeForFloor(floor: number): BiomeDefinition {
  if (floor <= 0) return BIOMES[0]!;
  return BIOMES.find((b) => floor >= b.minFloor && floor <= b.maxFloor) ?? BIOMES[BIOMES.length - 1]!;
}

export function getBossSpecForFloor(floor: number): BossSpec {
  const exact = BOSS_ROSTER.find((b) => b.floor === floor);
  if (exact) return exact;
  if (floor > FINAL_BOSS_FLOOR) {
    const cycle = Math.floor((floor - 100) / 10);
    return {
      archetype: "overdrive-apex",
      floor,
      name: `OVERDRIVE APEX-${cycle}`,
      title: "HARMONIC SINGULARITY",
      abilityLabel: "CARRIER BARRAGE",
      primaryColor: "#ffcf33",
      secondaryColor: "#996a08",
      glowColor: "#fffbe0",
    };
  }
  return BOSS_ROSTER[Math.max(0, Math.min(BOSS_ROSTER.length - 1, Math.floor((floor - 1) / 10)))]!;
}

export type EnemyClassId =
  | "dummy"
  | "stalker"
  | "brute"
  | "archer"
  | "phaser"
  | "flyer"
  | "bandit"
  | "boss";

export type EnemyLoreEntry = {
  id: EnemyClassId;
  title: string;
  weapon: WeaponArchetype;
  abilityName: string;
  lore: string;
};

export const ENEMY_LORE_CODEX: Record<EnemyClassId, EnemyLoreEntry> = {
  dummy: {
    id: "dummy",
    title: "Training Dummy",
    weapon: "Sword",
    abilityName: "Kinetic Blink Pad",
    lore: "A couple of sewn-together burlap sacks filled with cotton. Practice your moves on it before entering the cave!",
  },
  stalker: {
    id: "stalker",
    title: "Husk Stalker",
    weapon: "Sword",
    abilityName: "Relentless Slash",
    lore: "Once guards for the complex, they mutated and fused to their suits when the first pulse went out.",
  },
  brute: {
    id: "brute",
    title: "Husk Brute",
    weapon: "Broadsword",
    abilityName: "Armored Cannon Slam",
    lore: "These were guards experimented upon and turned into mindless super-soldiers. The Signal only made them angrier.",
  },
  archer: {
    id: "archer",
    title: "Husk Archer",
    weapon: "Rapier",
    abilityName: "Evasive Arrow Volley",
    lore: "Mutant bowmen that can’t use melee attacks. They run away when you get close.",
  },
  phaser: {
    id: "phaser",
    title: "Husk Phaser",
    weapon: "Plasma Cleaver",
    abilityName: "Laser-Aimed Dimension Blink",
    lore: "Imbued by the Signal with dimension-warping abilities, these former scientists can now teleport. They project a laser before they do.",
  },
  flyer: {
    id: "flyer",
    title: "Mutant Flyer",
    weapon: "Rapier",
    abilityName: "Aerial Dive-Bomb",
    lore: "Science experiments gone wrong, they escaped the lab when the Husks broke them out. They dive-bomb their prey.",
  },
  bandit: {
    id: "bandit",
    title: "Husk Bandit",
    weapon: "Sword",
    abilityName: "Timed Loot Snatch",
    lore: "Once intruders to the complex, they became strange goblin-like beings after being mutated by the Signal. They steal anything shiny and vanish if not caught in time.",
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
  { id: "tape-10", floorFound: 10, title: "TAPE 01 // VANCE-01 LOCKDOWN (F10)", transcript: "When the signal went out, only a few of the higher-ups escaped. Director Vance was one of them. He left Warden model VANCE-01 to guard the complex. He welded the bulkheads shut so none of the mutants – or survivors – could get out." },
  { id: "tape-20", floorFound: 20, title: "TAPE 02 // E1-IJ-4H RIOT SUIT (F20)", transcript: "Head scientist Elijah saw what would happen when the Signal reached him. In a last-ditch effort to save himself, he took shelter in his riot suit. It didn’t save him." },
  { id: "tape-30", floorFound: 30, title: "TAPE 03 // CPU TOWER NEST (F30)", transcript: "An overgrown Mutant Flyer that made its nest in the CPU towers. Kill it to keep the coolant flowing. It gets hot near the core." },
  { id: "tape-40", floorFound: 40, title: "TAPE 04 // ARCHIVIST NULL (F40)", transcript: "Once a regular scientist for BTC, after the signal went out he became Archivist Null, the keeper of the archives." },
  { id: "tape-50", floorFound: 50, title: "TAPE 05 // CRYO SENTINEL (F50)", transcript: "Once head engineer for the BTC, she was in charge of the coolant flow throughout the complex. Equipped with a cold-resistant riot suit, she can withstand freezing temperatures. Even so, she couldn't resist the Signal." },
  { id: "tape-60", floorFound: 60, title: "TAPE 06 // THERMAL TITAN (F60)", transcript: "He once worked as a stoker and was strong enough to toss large chunks of coal for hours at a time, until he met the Signal, which turned him into a bloodthirsty monster." },
  { id: "tape-70", floorFound: 70, title: "TAPE 07 // BARRACKS GARRISON (F70)", transcript: "The security barracks sealed themselves from the inside on Day 3. Only heavy armor plate remains standing in the dark." },
  { id: "tape-80", floorFound: 80, title: "TAPE 08 // DEEP REFINERY (F80)", transcript: "At 1,600 meters depth, the bedrock itself acts like a tuning fork. The smelters kept pouring molten alloy long after the crew stopped speaking." },
  { id: "tape-90", floorFound: 90, title: "TAPE 09 // ARMORY THRESHOLD (F90)", transcript: "Ten floors remain. Beyond the Armory vault lies the Grand Hall and the origin carrier wave." },
  { id: "tape-100", floorFound: 100, title: "TAPE 10 // THE SIGNAL SOVEREIGN (F100)", transcript: "He is the owner of the Bright Tomorrows Company, which made the facility—until he found something deep in the cave. It made him go mad. Now he’s just a being of pure energy." },
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
export type BreakablePropKind = "crate" | "canister" | "crystal" | "pipe-tree";
export type BreakableProp = { id: number; x: number; y: number; radius: number; kind: BreakablePropKind; health: number; maxHealth: number; broken: boolean };
export type RareChest = { x: number; y: number; opened: boolean; rarity: GearRarity };
export type ShopOffer = { id: string; kind: "gear" | "stim" | "mystery"; label: string; description: string; diamondCost: number; item?: GearItem; purchased: boolean };
export type RoomDefinition = { name: string; biome: BiomeDefinition; signalNote: string; blockers: RoomBlocker[]; props: BreakableProp[]; isBossFloor: boolean; isFinalBoss: boolean; bossSpec?: BossSpec; rareChest: RareChest | null };
export type EnemyProjectile = { id: number; x: number; y: number; vx: number; vy: number; damage: number; lifeMs: number; color: string; isArrow?: boolean; explosive?: boolean };
export type CombatPopup = { id: number; x: number; y: number; text: string; color: string; lifeMs: number };
export type VisualParticle = { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number; color: string; lifeMs: number; maxLifeMs: number };
export type BossEvent = { bossFloor: number; bossName: string; bossTitle: string; abilityLabel: string; subtitle: string; unlockedLink: number; bossSpec: BossSpec; loreTape: SignalTape | null; timestamp: number };
export type RunStatus = "title" | "training" | "entering-cave" | "briefing" | "playing" | "boss-lore" | "floor-clear" | "shop" | "victory-ending" | "escaped" | "defeated";
export type TutorialStep = 1 | 2 | 3 | 4;
export type PlayerInput = { moveX: number; moveY: number; lookX: number; lookY: number; attack: boolean; guard: boolean; dodge: boolean; interact: boolean };

export type Enemy = {
  id: number;
  kind: EnemyClassId;
  weapon: WeaponArchetype;
  bossSpec?: BossSpec;
  x: number;
  y: number;
  z: number;
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
  specialType:
    | "none"
    | "laser-tp"
    | "arrow"
    | "slam"
    | "explosive-shot"
    | "brood-spawn"
    | "cryo-nova"
    | "phase-blink"
    | "cross-beam"
    | "lava-shot"
    | "sovereign-barrage"
    | "starburst";
  aimTargetX: number;
  aimTargetY: number;
  diveStartX: number;
  diveStartY: number;
  attackCooldownMs: number;
  stunMs: number;
  hitFlashMs: number;
  facingX: number;
  facingY: number;
  strafeSign: number;
  stolenGold: number;
  stolenDiamonds: number;
  stealEscapeTimerMs: number;
  groundedVulnerableMs: number;
  perchX: number;
  perchY: number;
  spawnTimerMs: number;
  barrageRemainingMs: number;
  barrageShotTimerMs: number;
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
  tutorialStep: TutorialStep;
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
    chargeHoldMs: number;
    lastSwingCharged: boolean;
    dodgeCooldownMs: number;
    dodgeMs: number;
    invulnerableMs: number;
    guarding: boolean;
    guardStartMs: number;
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

function generateTrainingRoom(): RoomDefinition {
  const biome = getBiomeForFloor(0);
  return {
    name: "SECTOR 0 · OUTSIDE WAREHOUSE",
    biome,
    signalNote: "Complete 4 combat drills on the Training Dummy before entering the subterranean cave.",
    blockers: [
      { x: 185, y: 82, width: 56, height: 34, shape: "relay-console" },
      { x: 185, y: 295, width: 56, height: 34, shape: "relay-console" },
    ],
    props: [
      { id: 9001, x: 520, y: 92, radius: 13, kind: "crate", health: 20, maxHealth: 20, broken: false },
      { id: 9002, x: 520, y: 318, radius: 13, kind: "crate", health: 20, maxHealth: 20, broken: false },
    ],
    isBossFloor: false,
    isFinalBoss: false,
    rareChest: null,
  };
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
  const propKinds: BreakablePropKind[] = floor >= 41 && floor <= 50 ? ["pipe-tree", "canister", "crystal", "pipe-tree"] : ["crate", "canister", "crystal"];
  for (let p = 0; p < propCount; p++) {
    const kind = propKinds.at((floor + p) % propKinds.length)!;
    for (let attempt = 0; attempt < 30; attempt++) {
      const px = 140 + Math.floor(Math.random() * (WORLD_WIDTH - 250));
      const py = 56 + Math.floor(Math.random() * (WORLD_HEIGHT - 112));
      const blocked = blockers.some((b) => rectOverlaps(px - 22, py - 22, 44, 44, b.x, b.y, b.width, b.height, 14));
      const nearOtherProp = props.some((other) => Math.hypot(px - other.x, py - other.y) < 42);
      const nearSpawn = Math.hypot(px - 74, py - WORLD_HEIGHT / 2) < 95;
      if (!blocked && !nearOtherProp && !nearSpawn) {
        const hp = kind === "pipe-tree" ? 32 : kind === "crystal" ? 28 : kind === "canister" ? 18 : 22;
        props.push({ id: floor * 5000 + nextEntityId++, x: px, y: py, radius: kind === "pipe-tree" ? 15 : 13, kind, health: hp, maxHealth: hp, broken: false });
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
    ? "GRAND HALL · SIGNAL SOVEREIGN F100"
    : isBossFloor
      ? `SECTOR ${biome.sectorNumber}: ${biome.name} · GUARDIAN F${floor}`
      : `SECTOR ${biome.sectorNumber}: ${biome.name} · FLOOR ${String(floor).padStart(2, "0")}`;

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
  if (floor <= 2) return index % 3 === 2 ? "brute" : "stalker";
  if (floor <= 10) {
    const pool: EnemyClassId[] = ["stalker", "archer", "brute"];
    return pool.at((floor + index) % pool.length)!;
  }
  if (floor <= 20) {
    const pool: EnemyClassId[] = ["stalker", "archer", "brute", "phaser"];
    return pool.at((floor * 3 + index) % pool.length)!;
  }
  const pool: EnemyClassId[] = ["stalker", "archer", "brute", "phaser", "flyer"];
  return pool.at((floor * 3 + index) % pool.length)!;
}

function weaponForEnemyClass(kind: EnemyClassId): WeaponArchetype {
  switch (kind) {
    case "dummy":
    case "stalker": return "Sword";
    case "brute": return "Broadsword";
    case "archer": return "Rapier";
    case "phaser": return "Plasma Cleaver";
    case "flyer": return "Rapier";
    case "bandit": return "Sword";
    case "boss": return "Executioner";
  }
}

const FLANK_SLOTS = Array.of(0, -0.95, 0.95, -1.75, 1.75, 2.5, -2.5, 3.14);

function makeEnemyEntity(floor: number, id: number, kind: EnemyClassId, x: number, y: number, index = 0): Enemy {
  const standardScale = 1 + (floor - 1) * 0.16;
  const baseHp =
    kind === "dummy" ? 9999 :
    kind === "brute" ? 78 :
    kind === "phaser" ? 52 :
    kind === "archer" ? 44 :
    kind === "flyer" ? 42 :
    kind === "bandit" ? 48 : 44;
  const hp = kind === "dummy" ? 9999 : Math.round(baseHp * standardScale);
  const baseSpeed =
    kind === "dummy" ? 0 :
    kind === "bandit" ? 132 :
    kind === "flyer" ? 118 :
    kind === "archer" ? 96 :
    kind === "phaser" ? 92 :
    kind === "brute" ? 70 : 102;
  const baseDamage =
    kind === "dummy" ? 6 :
    kind === "brute" ? 20 :
    kind === "phaser" ? 16 :
    kind === "archer" ? 14 :
    kind === "flyer" ? 15 :
    kind === "bandit" ? 0 : 13;

  return {
    id,
    kind,
    weapon: weaponForEnemyClass(kind),
    x,
    y,
    z: kind === "flyer" ? 36 : 0,
    health: hp,
    maxHealth: hp,
    speed: kind === "dummy" ? 0 : Math.min(176, baseSpeed + floor * 0.4),
    damage: kind === "bandit" ? 0 : Math.round(baseDamage * (1 + Math.max(0, floor - 1) * 0.055)),
    flankAngle: FLANK_SLOTS.at(index % FLANK_SLOTS.length) ?? 0,
    windupMs: 0,
    maxWindupMs: kind === "brute" ? 560 : 420,
    abilityCooldownMs: 1400 + index * 280,
    specialWindupMs: 0,
    maxSpecialWindupMs: kind === "phaser" ? 420 : 400,
    specialType: "none",
    aimTargetX: 74,
    aimTargetY: WORLD_HEIGHT / 2,
    diveStartX: x,
    diveStartY: y,
    attackCooldownMs: 220 + index * 90,
    stunMs: 0,
    hitFlashMs: 0,
    facingX: -1,
    facingY: 0,
    strafeSign: index % 2 === 0 ? 1 : -1,
    stolenGold: 0,
    stolenDiamonds: 0,
    stealEscapeTimerMs: 0,
    groundedVulnerableMs: 0,
    perchX: x,
    perchY: y,
    spawnTimerMs: 0,
    barrageRemainingMs: 0,
    barrageShotTimerMs: 0,
  };
}

function createEnemiesForRoom(roomIndex: number, room: RoomDefinition): Enemy[] {
  const floor = roomIndex + 1;
  const bossScale = 1 + (floor - 1) * 0.24;
  const enemies: Enemy[] = [];

  if (room.isBossFloor) {
    const spec = room.bossSpec ?? getBossSpecForFloor(floor);
    const baseBossHp = room.isFinalBoss ? 780 : 240;
    const bossHp = Math.round(baseBossHp * bossScale);
    const bossPos = findClearEnemySpawn(room, 24, WORLD_WIDTH - 220, WORLD_WIDTH - 135, WORLD_HEIGHT / 2);
    const isMatriarch = spec.archetype === "matriarch-30";

    enemies.push({
      id: floor * 1000 + 1,
      kind: "boss",
      weapon: "Executioner",
      bossSpec: spec,
      x: bossPos.x,
      y: bossPos.y,
      z: 0,
      health: bossHp,
      maxHealth: bossHp,
      speed: isMatriarch ? 62 : Math.min(132, 74 + floor * 0.4),
      damage: isMatriarch ? 0 : Math.round((room.isFinalBoss ? 36 : 24) * (1 + (floor - 1) * 0.06)),
      flankAngle: 0,
      windupMs: 0,
      maxWindupMs: 560,
      abilityCooldownMs: 2100,
      specialWindupMs: 0,
      maxSpecialWindupMs: 680,
      specialType: "none",
      aimTargetX: 74,
      aimTargetY: WORLD_HEIGHT / 2,
      diveStartX: bossPos.x,
      diveStartY: bossPos.y,
      attackCooldownMs: 420,
      stunMs: 0,
      hitFlashMs: 0,
      facingX: -1,
      facingY: 0,
      strafeSign: 1,
      stolenGold: 0,
      stolenDiamonds: 0,
      stealEscapeTimerMs: 0,
      groundedVulnerableMs: 0,
      perchX: bossPos.x,
      perchY: bossPos.y,
      spawnTimerMs: 3000,
      barrageRemainingMs: 0,
      barrageShotTimerMs: 0,
    });
  }

  const pipeTrees = room.props.filter((p) => p.kind === "pipe-tree" && !p.broken);
  const mobCount = room.isBossFloor
    ? (room.bossSpec?.archetype === "matriarch-30" ? 0 : Math.min(4, 1 + Math.floor(floor / 25)))
    : Math.min(11, 3 + Math.floor(floor / 4));

  for (let i = 0; i < mobCount; i++) {
    const kind = pickEnemyClassForFloor(floor, i);
    const radius = kind === "brute" ? 15 : 12;
    let spawn = findClearEnemySpawn(room, radius, 290, WORLD_WIDTH - 95);
    if (kind === "flyer" && pipeTrees.length > 0) {
      const tree = pipeTrees.at(i % pipeTrees.length)!;
      spawn = { x: tree.x, y: tree.y };
    }
    enemies.push(makeEnemyEntity(floor, floor * 1000 + i + 10, kind, spawn.x, spawn.y, i));
  }

  if (!room.isBossFloor && Math.random() < 0.28) {
    const bSpawn = findClearEnemySpawn(room, 12, 320, WORLD_WIDTH - 95);
    enemies.push(makeEnemyEntity(floor, floor * 1000 + 99, "bandit", bSpawn.x, bSpawn.y, 0));
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

export function computePlayerMaxStats(level: number, stats: SurveyorStats, equipped: EquippedGearMap, slotUpgrades?: SlotUpgradeMap, activeSkinId?: string) {
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
  const skin = activeSkinId ? getSkinTheme(activeSkinId) : null;
  const baseHp = 115 + (level - 1) * 8 + stats.healthPoints * 14 + bonusHp;
  const baseAtk = 15 + (level - 1) * 2 + stats.damagePoints * 5 + bonusAtk;
  return {
    maxHealth: Math.round(baseHp * (1 + (skin?.healthPct ?? 0))),
    maxStamina: 65 + stats.agilityPoints * 5 + Math.round(bonusStamina * 0.25) + (skin?.staminaBonus ?? 0),
    totalAttack: Math.round(baseAtk * (1 + (skin?.attackPct ?? 0))),
    moveSpeedBonus: Math.min(140, stats.agilityPoints * 5 + bonusAgi + (skin?.speedBonus ?? 0)),
    goldMultiplier: 1 + (skin?.goldPct ?? 0),
  };
}

function makePlayerForProfile(profile: SurveyorProfile) {
  const computed = computePlayerMaxStats(profile.level, profile.stats, profile.equippedGear, profile.slotUpgradeLevels, profile.activeSkin);
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
    chargeHoldMs: 0,
    lastSwingCharged: false,
    dodgeCooldownMs: 0,
    dodgeMs: 0,
    invulnerableMs: 0,
    guarding: false,
    guardStartMs: 0,
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
    tutorialStep: 1,
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
  if (chosenFloor === 1 && !state.profile.introWatched) {
    const trainingRoom = generateTrainingRoom();
    const dummy = makeEnemyEntity(0, 99999, "dummy", 460, WORLD_HEIGHT / 2, 0);
    return {
      ...createDeepSignalRun(state.profile, 1, "training"),
      status: "training",
      tutorialStep: 1,
      currentRoom: trainingRoom,
      enemies: [dummy],
      message: "DRILL 1/4: Walk up and SLASH the Training Dummy [Click / J]!",
    };
  }
  const updatedProfile: SurveyorProfile = { ...state.profile, lastBattledFloor: chosenFloor };
  const fresh = createDeepSignalRun(updatedProfile, chosenFloor, "playing");
  return { ...fresh, message: "FLOOR " + String(chosenFloor).padStart(2, "0") + " · " + fresh.currentRoom.biome.name };
}

export function skipTrainingTutorial(state: DeepSignalRun): DeepSignalRun {
  const updatedProfile: SurveyorProfile = { ...state.profile, introWatched: true, lastBattledFloor: 1 };
  const fresh = createDeepSignalRun(updatedProfile, 1, "playing");
  return { ...fresh, message: "FLOOR 01 · " + fresh.currentRoom.biome.name };
}

function moveCharacter(x: number, y: number, dx: number, dy: number, room: RoomDefinition, radius = PLAYER_RADIUS, ignoreBlockers = false) {
  let nextX = clamp(x + dx, 28, WORLD_WIDTH - 28);
  if (!ignoreBlockers && collidesWithBlocker(nextX, y, room, radius)) nextX = x;
  let nextY = clamp(y + dy, 28, WORLD_HEIGHT - 28);
  if (!ignoreBlockers && collidesWithBlocker(nextX, nextY, room, radius)) nextY = y;
  return { x: nextX, y: nextY };
}

// Corner-unstuck steering: blends wall-tangent slide when fleeing near arena edges/corners
function computeCornerSafeFleeTarget(enemyX: number, enemyY: number, awayX: number, awayY: number, distance: number) {
  let dirX = awayX;
  let dirY = awayY;
  const margin = 76;
  const nearLeft = enemyX < margin;
  const nearRight = enemyX > WORLD_WIDTH - margin;
  const nearTop = enemyY < margin;
  const nearBottom = enemyY > WORLD_HEIGHT - margin;

  if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
    const toCenterX = WORLD_WIDTH / 2 - enemyX;
    const toCenterY = WORLD_HEIGHT / 2 - enemyY;
    const perpX = -dirY;
    const perpY = dirX;
    const sign = perpX * toCenterX + perpY * toCenterY >= 0 ? 1 : -1;
    dirX = perpX * sign;
    dirY = perpY * sign;
  } else if (nearLeft || nearRight) {
    dirX = nearLeft ? 0.35 : -0.35;
    dirY = Math.abs(dirY) < 0.25 ? (enemyY < WORLD_HEIGHT / 2 ? 1 : -1) : Math.sign(dirY);
  } else if (nearTop || nearBottom) {
    dirY = nearTop ? 0.35 : -0.35;
    dirX = Math.abs(dirX) < 0.25 ? (enemyX < WORLD_WIDTH / 2 ? 1 : -1) : Math.sign(dirX);
  }

  const n = normalized(dirX, dirY, 1, 0);
  return {
    x: clamp(enemyX + n.x * distance, 40, WORLD_WIDTH - 40),
    y: clamp(enemyY + n.y * distance, 40, WORLD_HEIGHT - 40),
  };
}

function moveEnemyToPoint(enemy: Enemy, targetX: number, targetY: number, seconds: number, room: RoomDefinition, ignoreBlockers = false) {
  const radius = enemy.kind === "boss" ? 20 : enemy.kind === "brute" ? 14 : 11;
  const stepDist = enemy.speed * seconds;
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
    if (ignoreBlockers || !collidesWithBlocker(lookAheadX, lookAheadY, room, radius)) {
      const moved = moveCharacter(enemy.x, enemy.y, vx * stepDist, vy * stepDist, room, radius, ignoreBlockers);
      if (Math.hypot(moved.x - enemy.x, moved.y - enemy.y) > stepDist * 0.35) {
        return { x: moved.x, y: moved.y, flipStrafe: i >= 3 && i % 2 === 1 };
      }
    }
  }

  const toward = normalized(targetX - enemy.x, targetY - enemy.y, -1, 0);
  const fallback = moveCharacter(enemy.x, enemy.y, toward.x * stepDist, toward.y * stepDist, room, radius, ignoreBlockers);
  return { x: fallback.x, y: fallback.y, flipStrafe: true };
}

function getWeaponSwingSpec(weapon?: WeaponArchetype) {
  switch (weapon) {
    case "Rapier": return { range: 54, coneDot: 0.35, cooldown: 205, knockback: 9, damageMult: 0.98 };
    case "Broadsword": return { range: 50, coneDot: -0.05, cooldown: 330, knockback: 18, damageMult: 1.14 };
    case "Plasma Cleaver": return { range: 58, coneDot: 0.08, cooldown: 285, knockback: 15, damageMult: 1.22 };
    case "Executioner": return { range: 56, coneDot: -0.15, cooldown: 370, knockback: 22, damageMult: 1.38 };
    case "Sword":
    default: return { range: 48, coneDot: 0.12, cooldown: 270, knockback: 13, damageMult: 1.0 };
  }
}

function addXP(player: DeepSignalRun["player"], xpGained: number) {
  let xp = player.xp + xpGained;
  let level = player.level;
  let xpToNext = player.xpToNext;
  let unspentStatPoints = 0;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
        unspentStatPoints += 1;
        xpToNext = Math.round(xpToNext * 1.22 + 25);
      }
      return { xp, level, xpToNext, unspentStatPoints };
    }
    
    function recordDiscoveredItem(profile: SurveyorProfile, baseKey: string, count = 1): SurveyorProfile {
      const discoveredItems = profile.discoveredItems.includes(baseKey)
        ? profile.discoveredItems
        : [...profile.discoveredItems, baseKey];
      const prevCount = profile.itemFoundCount[baseKey] ?? 0;
      return {
        ...profile,
        discoveredItems,
        totalItemsFound: profile.totalItemsFound + count,
        itemFoundCount: { ...profile.itemFoundCount, [baseKey]: prevCount + count },
      };
    }
    
    function recordEnemyKillTelemetry(
      profile: SurveyorProfile,
      enemyKey: string,
      equippedWeaponKey?: string,
    ): SurveyorProfile {
      const prev = profile.enemyRecords[enemyKey] ?? { kills: 0, deathsTo: 0, goldDropped: 0, gemsDropped: 0 };
      const nextRecords = {
        ...profile.enemyRecords,
        [enemyKey]: { ...prev, kills: prev.kills + 1 },
      };
      const nextItemKills = equippedWeaponKey
        ? { ...profile.itemKillsCount, [equippedWeaponKey]: (profile.itemKillsCount[equippedWeaponKey] ?? 0) + 1 }
        : profile.itemKillsCount;
      return {
        ...profile,
        enemyRecords: nextRecords,
        itemKillsCount: nextItemKills,
      };
    }
    
    function recordEnemyLootTelemetry(
      profile: SurveyorProfile,
      enemyKey: string,
      gold: number,
      gems: number,
      rarity?: GearRarity,
    ): SurveyorProfile {
      const prev = profile.enemyRecords[enemyKey] ?? { kills: 0, deathsTo: 0, goldDropped: 0, gemsDropped: 0 };
      const bestRarity =
        rarity && (!prev.bestRarity || RARITY_RANK[rarity] > RARITY_RANK[prev.bestRarity])
          ? rarity
          : prev.bestRarity;
      return {
        ...profile,
        enemyRecords: {
          ...profile.enemyRecords,
          [enemyKey]: {
            ...prev,
            goldDropped: prev.goldDropped + gold,
            gemsDropped: prev.gemsDropped + gems,
            bestRarity,
          },
        },
      };
    }
    
    function recordEnemyDeathTelemetry(profile: SurveyorProfile, killerKey: string): SurveyorProfile {
      const prev = profile.enemyRecords[killerKey] ?? { kills: 0, deathsTo: 0, goldDropped: 0, gemsDropped: 0 };
      return {
        ...profile,
        enemyRecords: {
          ...profile.enemyRecords,
          [killerKey]: { ...prev, deathsTo: prev.deathsTo + 1 },
        },
      };
    }
    
    function recordDiscoveredEnemies(profile: SurveyorProfile, enemies: Enemy[]): SurveyorProfile {
      let list = [...profile.discoveredEnemies];
      let changed = false;
      for (const enemy of enemies) {
        if (enemy.kind === "dummy") continue;
        if (!list.includes(enemy.kind)) {
          list.push(enemy.kind);
          changed = true;
        }
      }
      return changed ? { ...profile, discoveredEnemies: list } : profile;
    }
    
    function spawnHitSparks(particles: VisualParticle[], x: number, y: number, color: string, count = 6, speed = 115) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const spd = speed * (0.55 + Math.random() * 0.7);
        particles.push({ id: nextEntityId++, x, y, z: 12, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, vz: 60 + Math.random() * 80, size: 3, color, lifeMs: 260, maxLifeMs: 260 });
      }
    }
    
    function spawnLootBounce(pickups: LootPickup[], x: number, y: number, payload: { item?: GearItem; tapeId?: string; goldAmount?: number; diamondAmount?: number }) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 42 + Math.random() * 68;
      pickups.push({ id: nextEntityId++, x, y, z: 8, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 145 + Math.random() * 75, ...payload });
    }
    
    function findDummyTeleportSpot(currentX: number, currentY: number, playerX: number, playerY: number): { x: number; y: number } {
      const candidates = [
        { x: 540, y: 120 },
        { x: 540, y: 300 },
        { x: 340, y: 115 },
        { x: 340, y: 305 },
        { x: 470, y: WORLD_HEIGHT / 2 },
      ];
      for (const spot of candidates) {
        if (Math.hypot(spot.x - currentX, spot.y - currentY) > 90 && Math.hypot(spot.x - playerX, spot.y - playerY) > 105) {
          return spot;
        }
      }
      return { x: 480, y: WORLD_HEIGHT / 2 };
    }
    
    export function stepDeepSignalRun(state: DeepSignalRun, input: PlayerInput, dtMs: number): DeepSignalRun {
      if (state.status !== "playing" && state.status !== "training") return state;
      const isTraining = state.status === "training";
      const deltaMs = Math.min(50, Math.max(0, dtMs));
      let hitstopMs = Math.max(0, state.hitstopMs - deltaMs);
      const shakeMs = Math.max(0, state.shakeMs - deltaMs);
      let lastHitSound = state.lastHitSound;
      let lastKillSound = state.lastKillSound;
      let lastPickupSound = state.lastPickupSound;
      const combatPopups = state.combatPopups.map((p) => ({ ...p, y: p.y - 0.025 * deltaMs, lifeMs: p.lifeMs - deltaMs })).filter((p) => p.lifeMs > 0);
      const particles = state.particles
        .map((pt) => {
          const s = deltaMs / 1000;
          const nz = Math.max(0, pt.z + pt.vz * s);
          return { ...pt, x: pt.x + pt.vx * s, y: pt.y + pt.vy * s, z: nz, vz: nz > 0 ? pt.vz - 460 * s : 0, lifeMs: pt.lifeMs - deltaMs };
        })
        .filter((pt) => pt.lifeMs > 0);
    
      if (hitstopMs > 0) return { ...state, hitstopMs, shakeMs, combatPopups, particles };
    
      const seconds = deltaMs / 1000;
      const floor = state.roomIndex + 1;
      let tutorialStep = state.tutorialStep;
      let profile = {
        ...recordDiscoveredEnemies(state.profile, state.enemies),
        totalTimePlayedMs: state.profile.totalTimePlayedMs + deltaMs,
      };
      const computed = computePlayerMaxStats(state.player.level, state.player.stats, state.equippedGear, profile.slotUpgradeLevels, profile.activeSkin);
      const player = { ...state.player, maxHealth: computed.maxHealth, maxStamina: computed.maxStamina, health: Math.min(computed.maxHealth, state.player.health) };
    
      player.attackCooldownMs = Math.max(0, player.attackCooldownMs - deltaMs);
      player.attackMs = Math.max(0, player.attackMs - deltaMs);
      player.dodgeCooldownMs = Math.max(0, player.dodgeCooldownMs - deltaMs);
      player.dodgeMs = Math.max(0, player.dodgeMs - deltaMs);
      player.invulnerableMs = Math.max(0, player.invulnerableMs - deltaMs);
    
      const hasLook = Math.hypot(input.lookX, input.lookY) > 0.1;
      const hasMove = Math.hypot(input.moveX, input.moveY) > 0.1;
      if (hasLook) {
        const dir = normalized(input.lookX, input.lookY, player.facingX, player.facingY);
        player.facingX = dir.x;
        player.facingY = dir.y;
      } else if (hasMove) {
        const dir = normalized(input.moveX, input.moveY, player.facingX, player.facingY);
        player.facingX = dir.x;
        player.facingY = dir.y;
      }
    
      // Invincible Dash (Space): 450ms full invulnerability frames + stamina cost
      const dodgePressed = input.dodge && !state.dodgeWasDown;
      if (dodgePressed && player.dodgeCooldownMs <= 0 && player.stamina >= 20) {
        const dashDir = hasMove ? normalized(input.moveX, input.moveY) : { x: player.facingX, y: player.facingY };
        player.vx = dashDir.x * 435;
        player.vy = dashDir.y * 435;
        player.dodgeMs = 210;
        player.dodgeCooldownMs = 680;
        player.invulnerableMs = 450;
        player.stamina = Math.max(0, player.stamina - 20);
        spawnHitSparks(particles, player.x, player.y, "#63d2ff", 8, 95);
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 20, text: "INVINCIBLE DASH", color: "#63d2ff", lifeMs: 520 });
        if (isTraining && tutorialStep === 3) {
          tutorialStep = 4;
        }
      }
    
      // Shield Guard (Right-Click / Shift / K): 280ms Just-Guard parry window (100% nullified) + 75% hold block
      const wantsGuard = input.guard && player.stamina > 3 && player.dodgeMs <= 0;
      if (wantsGuard && !player.guarding) {
        player.guardStartMs = Date.now();
      }
      player.guarding = wantsGuard;
      if (player.guarding) {
        player.stamina = Math.max(0, player.stamina - 10 * seconds);
      } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 16 * seconds);
      }
    
      if (player.dodgeMs > 0) {
        const moved = moveCharacter(player.x, player.y, player.vx * seconds, player.vy * seconds, state.currentRoom);
        player.x = moved.x;
        player.y = moved.y;
      } else if (hasMove) {
        const moveDir = normalized(input.moveX, input.moveY);
        const guardSlow = player.guarding ? 0.62 : 1;
        const chargeSlow = player.chargeHoldMs > 180 ? 0.78 : 1;
        const speed = (178 + computed.moveSpeedBonus) * guardSlow * chargeSlow;
        const moved = moveCharacter(player.x, player.y, moveDir.x * speed * seconds, moveDir.y * speed * seconds, state.currentRoom);
        player.x = moved.x;
        player.y = moved.y;
      }
    
      // Charge Attack (Hold Left-Click / J for 0.9s -> release for 2x damage cleave)
      let triggerSwing = false;
      let isChargedSwing = false;
      if (input.attack) {
        player.chargeHoldMs = Math.min(CHARGE_FULL_MS + 400, player.chargeHoldMs + deltaMs);
        if (!state.attackWasDown && player.attackCooldownMs <= 0) {
          // Quick tap starts tracking; if released early it fires normal attack, if held >= 900ms it fires 2x Charge Attack
        }
      } else if (state.attackWasDown && player.attackCooldownMs <= 0) {
        triggerSwing = true;
        isChargedSwing = player.chargeHoldMs >= CHARGE_FULL_MS;
        player.chargeHoldMs = 0;
      } else if (!input.attack) {
        player.chargeHoldMs = 0;
      }
    
      let enemies = state.enemies.map((e) => ({
        ...e,
        attackCooldownMs: Math.max(0, e.attackCooldownMs - deltaMs),
        abilityCooldownMs: Math.max(0, e.abilityCooldownMs - deltaMs),
        stunMs: Math.max(0, e.stunMs - deltaMs),
        hitFlashMs: Math.max(0, e.hitFlashMs - deltaMs),
        groundedVulnerableMs: Math.max(0, e.groundedVulnerableMs - deltaMs),
        stealEscapeTimerMs: e.stealEscapeTimerMs > 0 ? Math.max(0, e.stealEscapeTimerMs - deltaMs) : 0,
      }));
    const props = state.currentRoom.props.map((p) => ({ ...p }));
    let rareChest = state.currentRoom.rareChest ? { ...state.currentRoom.rareChest } : null;
    let kills = state.kills;
    let score = state.score;
    let damageBlocked = state.damageBlocked;
    const pickups = [...state.pickups];
    let carriedGold = state.carriedGold;
    let carriedDiamonds = state.carriedDiamonds;
    let message = state.message;
    let lastKillerName = "Subterranean Husk";
    const newlySpawnedEnemies: Enemy[] = [];
    const equippedWeaponKey = state.equippedGear.weapon?.baseKey;
  
    if (triggerSwing && player.attackCooldownMs <= 0) {
      const swing = getWeaponSwingSpec(state.equippedGear.weapon?.weaponType);
      player.attackMs = isChargedSwing ? 210 : 155;
      player.attackCooldownMs = swing.cooldown;
      player.lastSwingCharged = isChargedSwing;
  
      if (isChargedSwing) {
        spawnHitSparks(particles, player.x + player.facingX * 20, player.y + player.facingY * 20, "#ffcf56", 12, 145);
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 26, text: "2X CHARGE CLEAVE!", color: "#ffcf56", lifeMs: 650 });
      }
  
      const effectiveRange = isChargedSwing ? swing.range + 16 : swing.range;
      const effectiveCone = isChargedSwing ? -0.35 : swing.coneDot;
  
      for (const prop of props) {
        if (prop.broken) continue;
        const dx = prop.x - player.x;
        const dy = prop.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= effectiveRange + prop.radius) {
          const dir = normalized(dx, dy, player.facingX, player.facingY);
          const dot = player.facingX * dir.x + player.facingY * dir.y;
          if (dot >= effectiveCone - 0.25 || dist < 30) {
            prop.health -= Math.max(10, Math.round(computed.totalAttack * (isChargedSwing ? 1.5 : 0.7)));
            spawnHitSparks(particles, prop.x, prop.y, prop.kind === "pipe-tree" ? "#63d2ff" : prop.kind === "crystal" ? "#79f2cc" : "#f5b971", prop.kind === "pipe-tree" ? 10 : 5, 95);
            if (prop.health <= 0) {
              prop.broken = true;
              player.stamina = Math.min(player.maxStamina, player.stamina + 8);
              combatPopups.push({ id: nextEntityId++, x: prop.x, y: prop.y - 14, text: "+8 STA", color: "#6fe3c1", lifeMs: 520 });
              if (prop.kind === "pipe-tree") {
                spawnHitSparks(particles, prop.x, prop.y, "#9be8ff", 18, 135);
              }
              if (Math.random() < 0.72) {
                spawnLootBounce(pickups, prop.x, prop.y, { goldAmount: Math.round((5 + Math.floor(floor * 1.4) + Math.floor(Math.random() * 8)) * computed.goldMultiplier) });
              }
              if (Math.random() < 0.14) {
                spawnLootBounce(pickups, prop.x, prop.y, { diamondAmount: 1 });
              }
            }
          }
        }
      }
  
      enemies = enemies
        .map((enemy) => {
          if (enemy.kind === "flyer" && enemy.z > 10) return enemy;
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.hypot(dx, dy);
          const reach = enemy.kind === "boss" ? effectiveRange + 14 : effectiveRange;
          if (dist > reach) return enemy;
          const toEnemy = normalized(dx, dy, player.facingX, player.facingY);
          const dot = player.facingX * toEnemy.x + player.facingY * toEnemy.y;
          if (dist > 28 && dot < effectiveCone) return enemy;
  
          if (enemy.kind === "dummy") {
            const dmg = Math.max(8, Math.round(computed.totalAttack * (isChargedSwing ? 2 : 1)));
            const nextSpot = findDummyTeleportSpot(enemy.x, enemy.y, player.x, player.y);
            spawnHitSparks(particles, enemy.x, enemy.y, "#63d2ff", 14, 140);
            spawnHitSparks(particles, nextSpot.x, nextSpot.y, "#ffcf56", 14, 140);
            lastHitSound = { kind: "hit", seq: (lastHitSound?.seq ?? 0) + 1 };
            combatPopups.push({
              id: nextEntityId++,
              x: enemy.x,
              y: enemy.y - 20,
              text: isChargedSwing ? `2X CHARGE -${dmg}! WARP!` : `-${dmg}! WARP!`,
              color: isChargedSwing ? "#ffcf56" : "#63d2ff",
              lifeMs: 700,
            });
            if (isTraining && tutorialStep === 1) {
              tutorialStep = 2;
            } else if (isTraining && tutorialStep === 2 && isChargedSwing) {
              tutorialStep = 3;
            }
            return { ...enemy, x: nextSpot.x, y: nextSpot.y, hitFlashMs: 160 };
          }
  
          const crit = Math.random() < 0.18;
          const bruteArmorFactor = enemy.kind === "brute" ? 0.85 : 1;
          const chargeMult = isChargedSwing ? 2.0 : 1.0;
          const rawDamage = computed.totalAttack * swing.damageMult * chargeMult * bruteArmorFactor * (crit ? 1.5 : 1);
          const finalDamage = Math.max(4, Math.round(rawDamage));
          const push = (enemy.kind === "boss" ? swing.knockback * 0.25 : swing.knockback) * (isChargedSwing ? 1.45 : 1);
          const pushed = moveCharacter(enemy.x, enemy.y, toEnemy.x * push, toEnemy.y * push, state.currentRoom, enemy.kind === "boss" ? 20 : 12);
          const nextHp = enemy.health - finalDamage;
          hitstopMs = enemy.kind === "boss" ? 28 : isChargedSwing ? 24 : 16;
          lastHitSound = { kind: "hit", seq: (lastHitSound?.seq ?? 0) + 1 };
          spawnHitSparks(particles, enemy.x, enemy.y, isChargedSwing || crit ? "#ffcf56" : "#ff6b6b", isChargedSwing ? 11 : 6, 140);
          combatPopups.push({
            id: nextEntityId++,
            x: enemy.x,
            y: enemy.y - 18,
            text: (isChargedSwing ? "2X -" : crit ? "CRIT -" : "-") + finalDamage,
            color: isChargedSwing || crit ? "#ffcf56" : "#ffffff",
            lifeMs: 650,
          });
  
          const enemyRecordKey = enemy.kind === "boss" ? `boss-${floor}` : enemy.kind;
  
          if (nextHp <= 0) {
            kills += 1;
            profile = recordEnemyKillTelemetry(profile, enemyRecordKey, equippedWeaponKey);
            const isBoss = enemy.kind === "boss";
            const staminaGain = isBoss ? 45 : 22;
            player.stamina = Math.min(player.maxStamina, player.stamina + staminaGain);
            combatPopups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y - 32, text: `+${staminaGain} STA`, color: "#79f2cc", lifeMs: 620 });
            lastKillSound = { isBoss, seq: (lastKillSound?.seq ?? 0) + 1 };
            score += isBoss ? 650 * floor : 95 + floor * 12;
            const leveled = addXP(player, isBoss ? 90 + floor * 16 : 24 + floor * 4);
            player.xp = leveled.xp;
            player.level = leveled.level;
            player.xpToNext = leveled.xpToNext;
            if (leveled.unspentStatPoints > 0) {
              profile = {
                ...profile,
                level: leveled.level,
                xp: leveled.xp,
                xpToNext: leveled.xpToNext,
                stats: {
                  ...profile.stats,
                  damagePoints: profile.stats.damagePoints + leveled.unspentStatPoints,
                },
              };
            }
            spawnHitSparks(particles, enemy.x, enemy.y, isBoss ? "#ffcf56" : "#79f2cc", isBoss ? 22 : 12, 165);
  
            if (enemy.kind === "bandit") {
              const returnGold = enemy.stolenGold + Math.round((18 + floor * 2) * computed.goldMultiplier);
              const returnDiamonds = enemy.stolenDiamonds + (Math.random() < 0.45 ? 1 : 0);
              profile = recordEnemyLootTelemetry(profile, enemyRecordKey, returnGold, returnDiamonds);
              spawnLootBounce(pickups, enemy.x, enemy.y, { goldAmount: returnGold });
              if (returnDiamonds > 0) spawnLootBounce(pickups, enemy.x, enemy.y, { diamondAmount: returnDiamonds });
            } else {
              const coinPiles = isBoss ? 5 : 1 + (Math.random() < 0.45 ? 1 : 0);
              let droppedGoldTotal = 0;
              for (let c = 0; c < coinPiles; c++) {
                const gAmt = Math.round((isBoss ? 18 + floor * 3 : 7 + Math.floor(floor * 1.6)) * computed.goldMultiplier);
                droppedGoldTotal += gAmt;
                spawnLootBounce(pickups, enemy.x, enemy.y, { goldAmount: gAmt });
              }
              let droppedGemsTotal = 0;
              let droppedRarity: GearRarity | undefined;
              if (isBoss) {
                const gemCount = 2 + Math.floor(floor / 15);
                droppedGemsTotal = gemCount;
                for (let g = 0; g < gemCount; g++) spawnLootBounce(pickups, enemy.x, enemy.y, { diamondAmount: 1 });
                const bossGear = makeGear(floor + 2, undefined, floor >= 20 ? "Legendary" : "Epic");
                droppedRarity = bossGear.rarity;
                spawnLootBounce(pickups, enemy.x, enemy.y, { item: bossGear });
                if (Math.random() < 0.65) spawnLootBounce(pickups, enemy.x, enemy.y, { item: makeGear(floor + 1, undefined, "Rare") });
              } else {
                if (Math.random() < 0.14 + Math.min(0.12, floor * 0.002)) {
                  droppedGemsTotal = 1;
                  spawnLootBounce(pickups, enemy.x, enemy.y, { diamondAmount: 1 });
                }
                if (Math.random() < 0.42) {
                  const gearDrop = makeGear(floor);
                  droppedRarity = gearDrop.rarity;
                  spawnLootBounce(pickups, enemy.x, enemy.y, { item: gearDrop });
                }
              }
              profile = recordEnemyLootTelemetry(profile, enemyRecordKey, droppedGoldTotal, droppedGemsTotal, droppedRarity);
            }
            return null;
          }
  
          return {
            ...enemy,
            x: pushed.x,
            y: pushed.y,
            health: nextHp,
            hitFlashMs: 130,
            stunMs: enemy.kind === "bandit" ? 320 : enemy.stunMs,
            windupMs: enemy.kind === "boss" ? enemy.windupMs : 0,
          };
        })
        .filter((e): e is Enemy => e !== null);
    }
    let projectiles = state.projectiles
    .map((proj) => ({ ...proj, x: proj.x + proj.vx * seconds, y: proj.y + proj.vy * seconds, lifeMs: proj.lifeMs - deltaMs }))
    .filter((proj) => {
      if (proj.lifeMs <= 0) {
        if (proj.explosive) spawnHitSparks(particles, proj.x, proj.y, "#9dff4d", 14, 150);
        return false;
      }
      if (proj.x < 22 || proj.x > WORLD_WIDTH - 22 || proj.y < 22 || proj.y > WORLD_HEIGHT - 22) {
        if (proj.explosive) spawnHitSparks(particles, proj.x, proj.y, "#9dff4d", 14, 150);
        return false;
      }
      const hitsWall = state.currentRoom.blockers.some((b) => proj.x > b.x && proj.x < b.x + b.width && proj.y > b.y && proj.y < b.y + b.height);
      if (hitsWall) {
        if (proj.explosive) spawnHitSparks(particles, proj.x, proj.y, "#9dff4d", 14, 150);
        return false;
      }
      return true;
    });

  const enemyPowerScale = 1 + Math.max(0, (computed.totalAttack - 25) / 140);

  enemies = enemies
    .map((enemy) => {
      if (enemy.kind === "dummy") {
        if (isTraining && tutorialStep === 4 && enemy.abilityCooldownMs <= 0) {
          const aim = normalized(player.x - enemy.x, player.y - enemy.y, -1, 0);
          projectiles.push({
            id: nextEntityId++,
            x: enemy.x + aim.x * 16,
            y: enemy.y + aim.y * 16,
            vx: aim.x * 165,
            vy: aim.y * 165,
            damage: 5,
            lifeMs: 2800,
            color: "#63d2ff",
            isArrow: true,
          });
          return { ...enemy, abilityCooldownMs: 1850, facingX: aim.x, facingY: aim.y };
        }
        return enemy;
      }

      if (enemy.stunMs > 0) return enemy;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const toward = normalized(dx, dy, enemy.facingX, enemy.facingY);

      if (enemy.kind === "bandit") {
        const hasStolen = enemy.stolenGold > 0 || enemy.stolenDiamonds > 0;
        if (!hasStolen) {
          if (dist <= PLAYER_RADIUS + 14) {
            const stealGold = Math.min(carriedGold, 15 + floor * 3);
            const stealDiamonds = Math.min(carriedDiamonds, 1 + Math.floor(floor / 20));
            carriedGold -= stealGold;
            carriedDiamonds -= stealDiamonds;
            combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 24, text: stealGold > 0 || stealDiamonds > 0 ? `STOLE ${stealGold}G ${stealDiamonds}◆! 6.5s!` : "SNATCHED! 6.5s!", color: "#ffcf56", lifeMs: 900 });
            spawnHitSparks(particles, player.x, player.y, "#ffcf56", 8, 110);
            return { ...enemy, stolenGold: stealGold, stolenDiamonds: stealDiamonds, stealEscapeTimerMs: 6500, facingX: -toward.x, facingY: -toward.y };
          }
          const moved = moveEnemyToPoint(enemy, player.x, player.y, seconds, state.currentRoom);
          return { ...enemy, x: moved.x, y: moved.y, facingX: toward.x, facingY: toward.y, strafeSign: moved.flipStrafe ? -enemy.strafeSign : enemy.strafeSign };
        } else {
          if (enemy.stealEscapeTimerMs <= 0) {
            spawnHitSparks(particles, enemy.x, enemy.y, "#b87aff", 14, 130);
            combatPopups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y - 22, text: "BANDIT ESCAPED WITH LOOT!", color: "#ff6b6b", lifeMs: 950 });
            return null;
          }
          const flee = computeCornerSafeFleeTarget(enemy.x, enemy.y, -toward.x, -toward.y, 160);
          const moved = moveEnemyToPoint(enemy, flee.x, flee.y, seconds * 1.08, state.currentRoom);
          return { ...enemy, x: moved.x, y: moved.y, facingX: -toward.x, facingY: -toward.y, strafeSign: moved.flipStrafe ? -enemy.strafeSign : enemy.strafeSign };
        }
      }

      if (enemy.kind === "flyer") {
        if (enemy.groundedVulnerableMs > 0) {
          return { ...enemy, z: 0 };
        }
        if (enemy.specialWindupMs > 0) {
          const nextSpecial = enemy.specialWindupMs - deltaMs;
          const progress = clamp(1 - nextSpecial / Math.max(1, enemy.maxSpecialWindupMs), 0, 1);
          const swoopX = enemy.diveStartX + (enemy.aimTargetX - enemy.diveStartX) * progress;
          const swoopY = enemy.diveStartY + (enemy.aimTargetY - enemy.diveStartY) * progress;
          const swoopZ = Math.max(0, Math.round((1 - progress) * 36));
          if (nextSpecial <= 0) {
            const land = moveCharacter(enemy.aimTargetX, enemy.aimTargetY, 0, 0, state.currentRoom, 11, true);
            if (Math.hypot(player.x - land.x, player.y - land.y) <= 34 && player.invulnerableMs <= 0) {
              const justGuarded = player.guarding && Date.now() - player.guardStartMs <= 280;
              const blocked = player.guarding && player.stamina > 2;
              const dmg = justGuarded ? 0 : Math.max(4, Math.round(enemy.damage * enemyPowerScale * (blocked ? 0.25 : 1)));
              if (dmg > 0) {
                player.health = Math.max(0, player.health - dmg);
                lastKillerName = ENEMY_LORE_CODEX.flyer.title;
                if (player.health <= 0) profile = recordEnemyDeathTelemetry(profile, "flyer");
              } else {
                damageBlocked += Math.round(enemy.damage * enemyPowerScale);
              }
              player.invulnerableMs = 260;
              lastHitSound = { kind: blocked ? "parry" : "hurt", seq: (lastHitSound?.seq ?? 0) + 1 };
              combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 20, text: justGuarded ? "JUST GUARD!" : blocked ? `GUARD -${dmg}` : `-${dmg}`, color: blocked ? "#63d2ff" : "#ff5f6d", lifeMs: 650 });
            }
            spawnHitSparks(particles, land.x, land.y, "#63d2ff", 10, 125);
            return { ...enemy, x: land.x, y: land.y, z: 0, specialWindupMs: 0, specialType: "none", groundedVulnerableMs: 1000, abilityCooldownMs: 2400 };
          }
          return { ...enemy, x: swoopX, y: swoopY, z: swoopZ, specialWindupMs: nextSpecial };
        }
        const targetZ = 36;
        const nextZ = enemy.z < targetZ ? Math.min(targetZ, enemy.z + 90 * seconds) : targetZ;
        if (dist <= 155 && enemy.abilityCooldownMs <= 0 && nextZ >= 28) {
          return {
            ...enemy,
            z: nextZ,
            specialType: "slam",
            specialWindupMs: 440,
            maxSpecialWindupMs: 440,
            diveStartX: enemy.x,
            diveStartY: enemy.y,
            aimTargetX: player.x,
            aimTargetY: player.y,
            facingX: toward.x,
            facingY: toward.y,
          };
        }
        const moved = moveEnemyToPoint(enemy, player.x, player.y, seconds * 0.72, state.currentRoom, true);
        return { ...enemy, x: moved.x, y: moved.y, z: nextZ, facingX: toward.x, facingY: toward.y };
      }

      if (enemy.kind === "archer") {
        if (enemy.specialWindupMs > 0) {
          const nextSpecial = enemy.specialWindupMs - deltaMs;
          if (nextSpecial <= 0) {
            const aimDir = normalized(enemy.aimTargetX - enemy.x, enemy.aimTargetY - enemy.y, toward.x, toward.y);
            projectiles.push({ id: nextEntityId++, x: enemy.x + aimDir.x * 14, y: enemy.y + aimDir.y * 14, vx: aimDir.x * 235, vy: aimDir.y * 235, damage: Math.max(5, Math.round(enemy.damage * enemyPowerScale)), lifeMs: 2200, color: "#8cff3b", isArrow: true });
            return { ...enemy, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 1850, facingX: aimDir.x, facingY: aimDir.y };
          }
          return { ...enemy, specialWindupMs: nextSpecial };
        }
        if (dist < 130) {
          const flee = computeCornerSafeFleeTarget(enemy.x, enemy.y, -toward.x, -toward.y, 130);
          const moved = moveEnemyToPoint(enemy, flee.x, flee.y, seconds * 1.15, state.currentRoom);
          return { ...enemy, x: moved.x, y: moved.y, facingX: toward.x, facingY: toward.y, strafeSign: moved.flipStrafe ? -enemy.strafeSign : enemy.strafeSign };
        }
        if (dist <= 310 && enemy.abilityCooldownMs <= 0) {
          return { ...enemy, specialType: "arrow", specialWindupMs: 360, maxSpecialWindupMs: 360, aimTargetX: player.x, aimTargetY: player.y, facingX: toward.x, facingY: toward.y };
        }
        const moved = moveEnemyToPoint(enemy, player.x, player.y, seconds * 0.7, state.currentRoom);
        return { ...enemy, x: moved.x, y: moved.y, facingX: toward.x, facingY: toward.y };
      }

      if (enemy.kind === "phaser") {
        if (enemy.specialWindupMs > 0) {
          const nextSpecial = enemy.specialWindupMs - deltaMs;
          if (nextSpecial <= 0) {
            const tpPos = moveCharacter(enemy.aimTargetX, enemy.aimTargetY, 0, 0, state.currentRoom, 11);
            spawnHitSparks(particles, enemy.x, enemy.y, "#ff4dff", 8, 105);
            spawnHitSparks(particles, tpPos.x, tpPos.y, "#ff4dff", 10, 115);
            return { ...enemy, x: tpPos.x, y: tpPos.y, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 2800, windupMs: 260, maxWindupMs: 260, facingX: toward.x, facingY: toward.y };
          }
          return { ...enemy, specialWindupMs: nextSpecial, facingX: toward.x, facingY: toward.y };
        }
        if (dist > 85 && dist <= 290 && enemy.abilityCooldownMs <= 0) {
          const behindX = clamp(player.x - player.facingX * 36, 44, WORLD_WIDTH - 44);
          const behindY = clamp(player.y - player.facingY * 36, 44, WORLD_HEIGHT - 44);
          return { ...enemy, specialType: "laser-tp", specialWindupMs: 460, maxSpecialWindupMs: 460, aimTargetX: behindX, aimTargetY: behindY, facingX: toward.x, facingY: toward.y };
        }
      }

      if (enemy.kind === "boss" && enemy.bossSpec) {
        const arch = enemy.bossSpec.archetype;

        if (arch === "matriarch-30") {
          const nextSpawn = enemy.spawnTimerMs - deltaMs;
          const patrolY = WORLD_HEIGHT / 2 + Math.sin(Date.now() / 650) * 95;
          const moved = moveEnemyToPoint(enemy, WORLD_WIDTH - 155, patrolY, seconds, state.currentRoom);
          if (nextSpawn <= 0) {
            const activeFlyers = enemies.filter((e) => e.kind === "flyer").length;
            if (activeFlyers < 6) {
              for (let s = 0; s < 2; s++) {
                const offsetY = s === 0 ? -36 : 36;
                const flyer = makeEnemyEntity(floor, nextEntityId++, "flyer", clamp(moved.x - 24, 60, WORLD_WIDTH - 60), clamp(moved.y + offsetY, 50, WORLD_HEIGHT - 50), s);
                flyer.z = 12;
                flyer.groundedVulnerableMs = 850;
                newlySpawnedEnemies.push(flyer);
              }
              spawnHitSparks(particles, moved.x, moved.y, "#63d2ff", 14, 130);
              combatPopups.push({ id: nextEntityId++, x: moved.x, y: moved.y - 34, text: "SPAWNED 2 FLYERS!", color: "#7ae6ff", lifeMs: 850 });
            }
            return { ...enemy, x: moved.x, y: moved.y, spawnTimerMs: 3000, facingX: toward.x, facingY: toward.y };
          }
          return { ...enemy, x: moved.x, y: moved.y, spawnTimerMs: nextSpawn, facingX: toward.x, facingY: toward.y };
        }

        if (arch === "riot-20") {
          if (enemy.specialWindupMs > 0) {
            const nextSpecial = enemy.specialWindupMs - deltaMs;
            if (nextSpecial <= 0) {
              const baseAng = Math.atan2(player.y - enemy.y, player.x - enemy.x);
              for (let b = -1; b <= 1; b++) {
                const ang = baseAng + b * 0.22;
                const isExplosive = b === 0;
                projectiles.push({ id: nextEntityId++, x: enemy.x + Math.cos(ang) * 20, y: enemy.y + Math.sin(ang) * 20, vx: Math.cos(ang) * 230, vy: Math.sin(ang) * 230, damage: Math.max(8, Math.round(enemy.damage * enemyPowerScale * (isExplosive ? 1.25 : 0.85))), lifeMs: 2100, color: isExplosive ? "#c8ff80" : "#7ae62e", isArrow: !isExplosive, explosive: isExplosive });
              }
              return { ...enemy, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 1950 };
            }
            return { ...enemy, specialWindupMs: nextSpecial, facingX: toward.x, facingY: toward.y };
          }
          if (enemy.abilityCooldownMs <= 0) {
            return { ...enemy, specialType: "explosive-shot", specialWindupMs: 480, maxSpecialWindupMs: 480, aimTargetX: player.x, aimTargetY: player.y, facingX: toward.x, facingY: toward.y };
          }
          const desiredX = clamp(player.x + 175, 220, WORLD_WIDTH - 95);
          const moved = moveEnemyToPoint(enemy, desiredX, player.y, seconds * 0.85, state.currentRoom);
          return { ...enemy, x: moved.x, y: moved.y, facingX: toward.x, facingY: toward.y };
        }

        if (arch === "archivist-40") {
          if (enemy.specialWindupMs > 0) {
            const nextSpecial = enemy.specialWindupMs - deltaMs;
            if (nextSpecial <= 0) {
              const tpPos = moveCharacter(enemy.aimTargetX, enemy.aimTargetY, 0, 0, state.currentRoom, 20);
              for (let r = 0; r < 10; r++) {
                const ang = (Math.PI * 2 * r) / 10;
                projectiles.push({ id: nextEntityId++, x: tpPos.x + Math.cos(ang) * 18, y: tpPos.y + Math.sin(ang) * 18, vx: Math.cos(ang) * 195, vy: Math.sin(ang) * 195, damage: Math.max(8, Math.round(enemy.damage * enemyPowerScale * 0.85)), lifeMs: 1650, color: "#f238ff" });
              }
              spawnHitSparks(particles, tpPos.x, tpPos.y, "#f238ff", 16, 155);
              return { ...enemy, x: tpPos.x, y: tpPos.y, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 2800 };
            }
            return { ...enemy, specialWindupMs: nextSpecial, facingX: toward.x, facingY: toward.y };
          }
          if (enemy.abilityCooldownMs <= 0) {
            const blinkX = clamp(player.x + (Math.random() < 0.5 ? 110 : -110), 60, WORLD_WIDTH - 60);
            const blinkY = clamp(player.y + (Math.random() < 0.5 ? 75 : -75), 60, WORLD_HEIGHT - 60);
            return { ...enemy, specialType: "laser-tp", specialWindupMs: 520, maxSpecialWindupMs: 520, aimTargetX: blinkX, aimTargetY: blinkY, facingX: toward.x, facingY: toward.y };
          }
        }

        if (arch === "thermal-60") {
          if (enemy.specialWindupMs > 0) {
            const nextSpecial = enemy.specialWindupMs - deltaMs;
            if (nextSpecial <= 0) {
              const aimDir = normalized(player.x - enemy.x, player.y - enemy.y, toward.x, toward.y);
              projectiles.push({ id: nextEntityId++, x: enemy.x + aimDir.x * 22, y: enemy.y + aimDir.y * 22, vx: aimDir.x * 215, vy: aimDir.y * 215, damage: Math.max(10, Math.round(enemy.damage * enemyPowerScale * 1.15)), lifeMs: 2200, color: "#ff7a45", explosive: true });
              return { ...enemy, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 2400 };
            }
            return { ...enemy, specialWindupMs: nextSpecial, facingX: toward.x, facingY: toward.y };
          }
          if (dist > 95 && enemy.abilityCooldownMs <= 0) {
            return { ...enemy, specialType: "lava-shot", specialWindupMs: 500, maxSpecialWindupMs: 500, aimTargetX: player.x, aimTargetY: player.y, facingX: toward.x, facingY: toward.y };
          }
        }

        if (arch === "sovereign-100" || arch === "overdrive-apex") {
          if (enemy.barrageRemainingMs > 0) {
            const nextBarrage = Math.max(0, enemy.barrageRemainingMs - deltaMs);
            let nextShot = enemy.barrageShotTimerMs - deltaMs;
            if (nextShot <= 0) {
              nextShot = 210;
              const baseAng = Math.atan2(player.y - enemy.y, player.x - enemy.x) + (Math.random() - 0.5) * 0.28;
              projectiles.push({ id: nextEntityId++, x: enemy.x + Math.cos(baseAng) * 22, y: enemy.y + Math.sin(baseAng) * 22, vx: Math.cos(baseAng) * 255, vy: Math.sin(baseAng) * 255, damage: Math.max(9, Math.round(enemy.damage * enemyPowerScale * 0.72)), lifeMs: 2100, color: "#ffcf33" });
            }
            return { ...enemy, barrageRemainingMs: nextBarrage, barrageShotTimerMs: nextShot, abilityCooldownMs: nextBarrage === 0 ? 2000 : enemy.abilityCooldownMs, facingX: toward.x, facingY: toward.y };
          }
          if (enemy.abilityCooldownMs <= 0) {
            combatPopups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y - 36, text: "CARRIER BARRAGE (3.0s)!", color: "#ffcf33", lifeMs: 850 });
            return { ...enemy, barrageRemainingMs: 3000, barrageShotTimerMs: 0, facingX: toward.x, facingY: toward.y };
          }
        }

        if (enemy.specialWindupMs > 0) {
          const nextSpecial = enemy.specialWindupMs - deltaMs;
          if (nextSpecial <= 0) {
            const ringCount = arch === "warden-10" ? 8 : 10;
            for (let r = 0; r < ringCount; r++) {
              const ang = (Math.PI * 2 * r) / ringCount;
              projectiles.push({ id: nextEntityId++, x: enemy.x + Math.cos(ang) * 18, y: enemy.y + Math.sin(ang) * 18, vx: Math.cos(ang) * 195, vy: Math.sin(ang) * 195, damage: Math.max(7, Math.round(enemy.damage * enemyPowerScale * 0.8)), lifeMs: 1650, color: enemy.bossSpec.glowColor });
            }
            spawnHitSparks(particles, enemy.x, enemy.y, enemy.bossSpec.primaryColor, 16, 155);
            combatPopups.push({ id: nextEntityId++, x: enemy.x, y: enemy.y - 34, text: enemy.bossSpec.abilityLabel, color: enemy.bossSpec.glowColor, lifeMs: 800 });
            return { ...enemy, specialWindupMs: 0, specialType: "none", abilityCooldownMs: 3200 };
          }
          return { ...enemy, specialWindupMs: nextSpecial, facingX: toward.x, facingY: toward.y };
        }
        if (dist <= 220 && enemy.abilityCooldownMs <= 0 && enemy.windupMs <= 0) {
          return { ...enemy, specialType: "slam", specialWindupMs: 560, maxSpecialWindupMs: 560, aimTargetX: player.x, aimTargetY: player.y, facingX: toward.x, facingY: toward.y };
        }
      }

      const meleeReach = enemy.kind === "boss" ? 50 : enemy.kind === "brute" ? 42 : 36;
      if (enemy.windupMs > 0) {
        const nextWindup = enemy.windupMs - deltaMs;
        if (nextWindup <= 0) {
          if (dist <= meleeReach + 8 && player.invulnerableMs <= 0) {
            const toPlayer = normalized(player.x - enemy.x, player.y - enemy.y);
            const frontal = player.facingX * -toPlayer.x + player.facingY * -toPlayer.y > -0.25;
            if (player.guarding && frontal && player.stamina >= 10) {
              player.stamina = Math.max(0, player.stamina - 10);
              damageBlocked += Math.round(enemy.damage * enemyPowerScale);
              lastHitSound = { kind: "parry", seq: (lastHitSound?.seq ?? 0) + 1 };
              spawnHitSparks(particles, player.x, player.y, "#63d2ff", 9, 120);
              combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 20, text: "PARRY!", color: "#63d2ff", lifeMs: 650 });
              return { ...enemy, windupMs: 0, stunMs: 550, attackCooldownMs: 950 };
            }
            const justGuarded = player.guarding && Date.now() - player.guardStartMs <= 280;
            const blocked = player.guarding && player.stamina > 2;
            const dmg = justGuarded ? 0 : Math.max(3, Math.round(enemy.damage * enemyPowerScale * (blocked ? 0.25 : 1)));
            if (dmg > 0) {
              player.health = Math.max(0, player.health - dmg);
              lastKillerName = enemy.bossSpec?.name ?? ENEMY_LORE_CODEX[enemy.kind].title;
              if (player.health <= 0) {
                profile = recordEnemyDeathTelemetry(profile, enemy.kind === "boss" ? `boss-${floor}` : enemy.kind);
              }
            } else {
              damageBlocked += Math.round(enemy.damage * enemyPowerScale);
            }
            player.invulnerableMs = 240;
            lastHitSound = { kind: blocked ? "parry" : "hurt", seq: (lastHitSound?.seq ?? 0) + 1 };
            spawnHitSparks(particles, player.x, player.y, blocked ? "#63d2ff" : "#ff5f6d", 7, 115);
            combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 20, text: justGuarded ? "JUST GUARD!" : blocked ? `GUARD -${dmg}` : `-${dmg}`, color: blocked ? "#63d2ff" : "#ff5f6d", lifeMs: 650 });
          }
          return { ...enemy, windupMs: 0, attackCooldownMs: enemy.kind === "boss" ? 820 : 920 };
        }
        return { ...enemy, windupMs: nextWindup, facingX: toward.x, facingY: toward.y };
      }

      if (dist <= meleeReach && enemy.attackCooldownMs <= 0) {
        return { ...enemy, windupMs: enemy.maxWindupMs, facingX: toward.x, facingY: toward.y };
      }

      const desiredDist = meleeReach - 4;
      const targetX = player.x + Math.cos(enemy.flankAngle) * desiredDist;
      const targetY = player.y + Math.sin(enemy.flankAngle) * desiredDist;
      const moved = moveEnemyToPoint(enemy, targetX, targetY, seconds, state.currentRoom);
      return { ...enemy, x: moved.x, y: moved.y, facingX: toward.x, facingY: toward.y, strafeSign: moved.flipStrafe ? -enemy.strafeSign : enemy.strafeSign };
    })
    .filter((e): e is Enemy => e !== null);

  if (newlySpawnedEnemies.length > 0) {
    enemies = [...enemies, ...newlySpawnedEnemies];
  }

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies.at(i)!;
    if (e.kind === "flyer" && e.z > 12) continue;
    const minPlayerDist = PLAYER_RADIUS + (e.kind === "boss" ? 20 : e.kind === "brute" ? 14 : 11);
    const pdx = e.x - player.x;
    const pdy = e.y - player.y;
    const pdist = Math.hypot(pdx, pdy);
    if (pdist < minPlayerDist) {
      const pushDir = pdist > 0.01 ? { x: pdx / pdist, y: pdy / pdist } : { x: 1, y: 0 };
      const overlap = minPlayerDist - pdist;
      const pushed = moveCharacter(e.x, e.y, pushDir.x * overlap, pushDir.y * overlap, state.currentRoom, e.kind === "boss" ? 20 : 11);
      e.x = pushed.x;
      e.y = pushed.y;
    }
    for (let j = i + 1; j < enemies.length; j++) {
      const other = enemies.at(j)!;
      if (other.kind === "flyer" && other.z > 12) continue;
      const minPairDist = 22;
      const edx = other.x - e.x;
      const edy = other.y - e.y;
      const edist = Math.hypot(edx, edy);
      if (edist < minPairDist && edist > 0.01) {
        const push = (minPairDist - edist) * 0.5;
        const nx = edx / edist;
        const ny = edy / edist;
        const m1 = moveCharacter(e.x, e.y, -nx * push, -ny * push, state.currentRoom, 11);
        const m2 = moveCharacter(other.x, other.y, nx * push, ny * push, state.currentRoom, 11);
        e.x = m1.x;
        e.y = m1.y;
        other.x = m2.x;
        other.y = m2.y;
      }
    }
  }

  projectiles = projectiles.filter((proj) => {
    if (Math.hypot(proj.x - player.x, proj.y - player.y) > PLAYER_RADIUS + 5) return true;
    if (proj.explosive) {
      spawnHitSparks(particles, proj.x, proj.y, "#c8ff80", 16, 165);
      combatPopups.push({ id: nextEntityId++, x: proj.x, y: proj.y - 26, text: "BOOM!", color: "#c8ff80", lifeMs: 650 });
    }
    if (player.invulnerableMs <= 0) {
      const justGuarded = player.guarding && Date.now() - player.guardStartMs <= 280;
      const blocked = player.guarding && player.stamina > 2;
      if (blocked && isTraining && tutorialStep === 4) {
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 28, text: "DRILL 4 COMPLETE!", color: "#6fe3c1", lifeMs: 850 });
        tutorialStep = 4;
        enemies = [];
      }
      const dmg = justGuarded || isTraining ? 0 : Math.max(3, Math.round(proj.damage * (blocked ? 0.25 : 1)));
      if (dmg > 0) {
        player.health = Math.max(0, player.health - dmg);
        if (player.health <= 0) {
          const activeBoss = enemies.find((e) => e.kind === "boss");
          profile = recordEnemyDeathTelemetry(profile, activeBoss ? `boss-${floor}` : "archer");
        }
      } else {
        damageBlocked += Math.round(proj.damage);
      }
      player.invulnerableMs = 220;
      lastHitSound = { kind: blocked ? "parry" : "hurt", seq: (lastHitSound?.seq ?? 0) + 1 };
      spawnHitSparks(particles, player.x, player.y, proj.color, 7, 110);
      combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 20, text: justGuarded || isTraining ? "BLOCKED!" : blocked ? `GUARD -${dmg}` : `-${dmg}`, color: blocked ? "#63d2ff" : "#ff5f6d", lifeMs: 650 });
    }
    return false;
  });

  const carriedGear = [...state.carriedGear];
  const carriedTapes = [...state.carriedTapes];
  const remainingPickups: LootPickup[] = [];
  for (const pk of pickups) {
    const nx = clamp(pk.x + pk.vx * seconds, 32, WORLD_WIDTH - 32);
    const ny = clamp(pk.y + pk.vy * seconds, 32, WORLD_HEIGHT - 32);
    const nz = Math.max(0, pk.z + pk.vz * seconds);
    const nvz = nz > 0 ? pk.vz - 460 * seconds : 0;
    const nvx = nz > 0 ? pk.vx * 0.96 : pk.vx * 0.78;
    const nvy = nz > 0 ? pk.vy * 0.96 : pk.vy * 0.78;

    const toPlayer = normalized(player.x - nx, player.y - ny, 0, 0);
    const dist = Math.hypot(player.x - nx, player.y - ny);
    const magPull = dist < 110 ? 220 : 0;
    const mx = clamp(nx + toPlayer.x * magPull * seconds, 32, WORLD_WIDTH - 32);
    const my = clamp(ny + toPlayer.y * magPull * seconds, 32, WORLD_HEIGHT - 32);

    if (Math.hypot(player.x - mx, player.y - my) <= PLAYER_RADIUS + 14) {
      if (pk.goldAmount) {
        carriedGold += pk.goldAmount;
        profile = { ...profile, totalGoldEarned: profile.totalGoldEarned + pk.goldAmount };
        lastPickupSound = { kind: "gold", seq: (lastPickupSound?.seq ?? 0) + 1 };
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 22, text: `+${pk.goldAmount} GOLD`, color: "#ffcf56", lifeMs: 600 });
      } else if (pk.diamondAmount) {
        carriedDiamonds += pk.diamondAmount;
        profile = { ...profile, totalDiamondsEarned: profile.totalDiamondsEarned + pk.diamondAmount };
        lastPickupSound = { kind: "diamond", seq: (lastPickupSound?.seq ?? 0) + 1 };
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 22, text: `+${pk.diamondAmount} GEM`, color: "#63d2ff", lifeMs: 680 });
      } else if (pk.item) {
        carriedGear.push(pk.item);
        profile = recordDiscoveredItem(profile, pk.item.baseKey, pk.item.count);
        lastPickupSound = { kind: "gear", seq: (lastPickupSound?.seq ?? 0) + 1 };
        combatPopups.push({ id: nextEntityId++, x: player.x, y: player.y - 24, text: pk.item.name, color: "#79f2cc", lifeMs: 750 });
      } else if (pk.tapeId) {
        if (!carriedTapes.includes(pk.tapeId)) carriedTapes.push(pk.tapeId);
      }
    } else {
      remainingPickups.push({ ...pk, x: mx, y: my, z: nz, vx: nvx, vy: nvy, vz: nvz });
    }
  }

  const interactPressed = input.interact && !state.interactWasDown;
  if (rareChest && !rareChest.opened && Math.hypot(player.x - rareChest.x, player.y - rareChest.y) <= 38 && (interactPressed || triggerSwing)) {
    rareChest.opened = true;
    const reward = makeGear(floor + 2, undefined, rareChest.rarity);
    spawnLootBounce(remainingPickups, rareChest.x, rareChest.y, { item: reward });
    spawnLootBounce(remainingPickups, rareChest.x, rareChest.y, { goldAmount: 20 + floor * 3 });
    spawnHitSparks(particles, rareChest.x, rareChest.y, "#ffcf56", 14, 130);
    message = `Opened Relic Chest: ${reward.name}!`;
  }

  if (player.health <= 0 && !isTraining) {
    const lost = carriedGear.length;
    const savedProfile: SurveyorProfile = {
      ...profile,
      gold: profile.gold + Math.floor(carriedGold * 0.4),
      deepestFloor: Math.max(profile.deepestFloor, floor),
      lastBattledFloor: floor,
    };
    return {
      ...state,
      status: "defeated",
      profile: savedProfile,
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
      pickups: remainingPickups,
      carriedGear: [],
      carriedTapes: [],
      carriedGold: 0,
      carriedDiamonds: 0,
      kills,
      score,
      damageBlocked,
      lostGearCount: lost,
      message: `Suit integrity lost to ${lastKillerName}! Unbanked gear dropped in the shaft.`,
      attackWasDown: input.attack,
      dodgeWasDown: input.dodge,
      interactWasDown: input.interact,
    };
  }

  const roomCleared = enemies.length === 0;
  let lastBossEvent = state.lastBossEvent;
  let pendingBossLore = state.pendingBossLore;
  let nextStatus: RunStatus = isTraining ? "training" : "playing";

  if (isTraining) {
    if (roomCleared) {
      message = "ALL DRILLS COMPLETE! Walk right into the Cave Entrance to begin Floor 01!";
      if (player.x >= WORLD_WIDTH - 92) {
        return skipTrainingTutorial({ ...state, profile });
      }
    } else if (tutorialStep === 1) {
      message = "DRILL 1/4: Walk up and SLASH the Training Dummy [Click / J]!";
    } else if (tutorialStep === 2) {
      message = "DRILL 2/4: HOLD [Left-Click / J] for 0.9s until glowing, then RELEASE for 2X CHARGE!";
    } else if (tutorialStep === 3) {
      message = "DRILL 3/4: Press [SPACE] to perform an INVINCIBLE DASH!";
    } else {
      message = "DRILL 4/4: Hold [Right-Click / Shift / K] to SHIELD BLOCK the Dummy's bolt!";
    }
  } else if (roomCleared && !state.roomCleared && state.currentRoom.isBossFloor && state.currentRoom.bossSpec) {
    const spec = state.currentRoom.bossSpec;
    const nextLink = floor + 1;
    const unlockedLinks = profile.unlockedSignalLinks.includes(nextLink)
      ? profile.unlockedSignalLinks
      : [...profile.unlockedSignalLinks, nextLink].sort((a, b) => a - b);
    const loreTape = SIGNAL_TAPES_DB.find((t) => t.floorFound === floor) ?? null;
    const updatedTapes = loreTape && !profile.decodedTapes.includes(loreTape.id)
      ? [...profile.decodedTapes, loreTape.id]
      : profile.decodedTapes;

    profile = {
      ...profile,
      unlockedSignalLinks: unlockedLinks,
      decodedTapes: updatedTapes,
      deepestFloor: Math.max(profile.deepestFloor, floor),
      lastBattledFloor: nextLink,
    };

    const event: BossEvent = {
      bossFloor: floor,
      bossName: spec.name,
      bossTitle: spec.title,
      abilityLabel: spec.abilityLabel,
      subtitle: `SIGNAL LINK F${String(nextLink).padStart(2, "0")} SYNCHRONIZED`,
      unlockedLink: nextLink,
      bossSpec: spec,
      loreTape,
      timestamp: Date.now(),
    };
    lastBossEvent = event;
    pendingBossLore = event;
    nextStatus = "boss-lore";
  } else if (roomCleared && player.x >= WORLD_WIDTH - 92) {
    nextStatus = state.currentRoom.isFinalBoss && !state.overdriveMode ? "victory-ending" : "floor-clear";
  }

  return {
    ...state,
    status: nextStatus,
    tutorialStep,
    currentRoom: { ...state.currentRoom, props, rareChest },
    profile: { ...profile, deepestFloor: Math.max(profile.deepestFloor, floor), lastBattledFloor: floor },
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
    pickups: remainingPickups,
    carriedGear,
    carriedTapes,
    carriedGold,
    carriedDiamonds,
    kills,
    score,
    damageBlocked,
    roomCleared,
    lastBossEvent,
    pendingBossLore,
    message: isTraining ? message : roomCleared ? "SECTOR CLEAR — Move right into the Extraction Lift!" : message,
    attackWasDown: input.attack,
    dodgeWasDown: input.dodge,
    interactWasDown: input.interact,
  };
}

export function acknowledgeBossLore(state: DeepSignalRun): DeepSignalRun {
  if (state.status !== "boss-lore") return state;
  return { ...state, status: "playing", pendingBossLore: null, message: "GUARDIAN NEUTRALIZED — Enter the Extraction Lift on the right!" };
}

export function descendToNextFloor(state: DeepSignalRun): DeepSignalRun {
  const nextIndex = state.roomIndex + 1;
  const nextFloor = nextIndex + 1;
  const nextRoom = generateProceduralRoom(nextIndex);
  const nextPlayer = { ...state.player, x: 74, y: WORLD_HEIGHT / 2, vx: 0, vy: 0, dodgeMs: 0, attackMs: 0 };
  return {
    ...state,
    status: "playing",
    roomIndex: nextIndex,
    currentRoom: nextRoom,
    profile: { ...state.profile, lastBattledFloor: nextFloor },
    player: nextPlayer,
    enemies: createEnemiesForRoom(nextIndex, nextRoom),
    projectiles: [],
    pickups: [],
    roomCleared: false,
    pendingBossLore: null,
    message: "FLOOR " + String(nextFloor).padStart(2, "0") + " · " + nextRoom.biome.name,
  };
}

export function enterOverdriveEndless(state: DeepSignalRun): DeepSignalRun {
  return descendToNextFloor({ ...state, overdriveMode: true });
}

export function openDiamondMerchant(state: DeepSignalRun): DeepSignalRun {
  const floor = state.roomIndex + 1;
  return { ...state, status: "shop", shopOffers: generateDiamondShopOffers(floor) };
}

export function closeDiamondMerchant(state: DeepSignalRun): DeepSignalRun {
  return { ...state, status: "floor-clear" };
}

export function buyDiamondShopOffer(state: DeepSignalRun, offerId: string): DeepSignalRun {
  const offer = state.shopOffers.find((o) => o.id === offerId);
  if (!offer || offer.purchased) return state;
  const totalDiamonds = state.profile.diamonds + state.carriedDiamonds;
  if (totalDiamonds < offer.diamondCost) return state;

  let remainingCost = offer.diamondCost;
  let carriedDiamonds = state.carriedDiamonds;
  let profileDiamonds = state.profile.diamonds;
  const fromCarried = Math.min(carriedDiamonds, remainingCost);
  carriedDiamonds -= fromCarried;
  remainingCost -= fromCarried;
  profileDiamonds -= remainingCost;

  let player = { ...state.player };
  const carriedGear = [...state.carriedGear];
  let profile = { ...state.profile, diamonds: profileDiamonds };

  if (offer.kind === "stim") {
    player = { ...player, health: player.maxHealth, stamina: player.maxStamina };
  } else if (offer.kind === "mystery") {
    const mysteryItem = makeGear(state.roomIndex + 3);
    carriedGear.push(mysteryItem);
    profile = recordDiscoveredItem(profile, mysteryItem.baseKey, 1);
  } else if (offer.kind === "gear" && offer.item) {
    carriedGear.push(offer.item);
    profile = recordDiscoveredItem(profile, offer.item.baseKey, 1);
  }

  return {
    ...state,
    profile,
    player,
    carriedGear,
    carriedDiamonds,
    shopOffers: state.shopOffers.map((o) => (o.id === offerId ? { ...o, purchased: true } : o)),
  };
}

export function extractFromCave(state: DeepSignalRun): DeepSignalRun {
  const floor = state.roomIndex + 1;
  const mergedBank = stackGearList([...state.profile.bankedGear, ...state.carriedGear]);
  let discovered = [...state.profile.discoveredItems];
  for (const item of state.carriedGear) {
    if (!discovered.includes(item.baseKey)) discovered.push(item.baseKey);
  }
  const decodedTapes = Array.from(new Set([...state.profile.decodedTapes, ...state.carriedTapes]));
  const updatedProfile: SurveyorProfile = {
    ...state.profile,
    gold: state.profile.gold + state.carriedGold,
    diamonds: state.profile.diamonds + state.carriedDiamonds,
    bankedGear: mergedBank,
    equippedGear: { ...state.equippedGear },
    discoveredItems: discovered,
    decodedTapes,
    deepestFloor: Math.max(state.profile.deepestFloor, floor),
    totalExtractions: state.profile.totalExtractions + 1,
  };
  return {
    ...state,
    status: "escaped",
    profile: updatedProfile,
    carriedGear: [],
    carriedTapes: [],
    carriedGold: 0,
    carriedDiamonds: 0,
    message: "Extraction complete! All loot & currencies banked.",
  };
}

export function allocateSurveyorStat(state: DeepSignalRun, stat: "healthPoints" | "damagePoints" | "agilityPoints"): DeepSignalRun {
  const nextStats: SurveyorStats = { ...state.profile.stats, [stat]: state.profile.stats[stat] + 1 };
  const nextProfile: SurveyorProfile = { ...state.profile, stats: nextStats };
  const computed = computePlayerMaxStats(nextProfile.level, nextStats, state.equippedGear, nextProfile.slotUpgradeLevels, nextProfile.activeSkin);
  return {
    ...state,
    profile: nextProfile,
    player: { ...state.player, stats: nextStats, maxHealth: computed.maxHealth, health: Math.min(computed.maxHealth, state.player.health + 14), maxStamina: computed.maxStamina },
  };
}

export function getSlotUpgradeCost(level: number): number {
  return Math.round(45 + level * 28 + Math.pow(level, 1.45) * 6);
}

export function getMultiSlotUpgradePlan(currentLevel: number, availableGold: number, countMode: number | "max") {
  let lv = currentLevel;
  let totalCost = 0;
  let levelsGained = 0;
  const limit = countMode === "max" ? MAX_SLOT_UPGRADE_LEVEL - currentLevel : countMode;
  for (let i = 0; i < limit; i++) {
    if (lv >= MAX_SLOT_UPGRADE_LEVEL) break;
    const cost = getSlotUpgradeCost(lv);
    if (totalCost + cost > availableGold) break;
    totalCost += cost;
    lv += 1;
    levelsGained += 1;
  }
  return { levelsGained, totalCost, nextLevel: lv };
}

export function upgradeEquippedSlotBulkWithGold(state: DeepSignalRun, slot: GearSlot, countMode: number | "max"): DeepSignalRun {
  const currentLevel = state.profile.slotUpgradeLevels[slot] ?? 1;
  const totalGold = state.profile.gold + state.carriedGold;
  const plan = getMultiSlotUpgradePlan(currentLevel, totalGold, countMode);
  if (plan.levelsGained <= 0) return state;

  let remaining = plan.totalCost;
  let carriedGold = state.carriedGold;
  let profileGold = state.profile.gold;
  const fromProfile = Math.min(profileGold, remaining);
  profileGold -= fromProfile;
  remaining -= fromProfile;
  carriedGold -= remaining;

  const nextLevels: SlotUpgradeMap = { ...state.profile.slotUpgradeLevels, [slot]: plan.nextLevel };
  const nextProfile: SurveyorProfile = { ...state.profile, gold: profileGold, slotUpgradeLevels: nextLevels };
  const computed = computePlayerMaxStats(state.player.level, state.player.stats, state.equippedGear, nextLevels, nextProfile.activeSkin);

  return {
    ...state,
    profile: nextProfile,
    carriedGold,
    player: { ...state.player, maxHealth: computed.maxHealth, health: Math.min(computed.maxHealth, state.player.health + 10 * plan.levelsGained), maxStamina: computed.maxStamina },
  };
}

export function equipBankItem(state: DeepSignalRun, bankItemId: string): DeepSignalRun {
  const idx = state.profile.bankedGear.findIndex((i) => i.id === bankItemId);
  if (idx < 0) return state;
  const target = state.profile.bankedGear.at(idx)!;
  const singleEquip: GearItem = { ...target, count: 1 };
  const nextBank = [...state.profile.bankedGear];
  if (target.count > 1) {
    nextBank[idx] = { ...target, count: target.count - 1 };
  } else {
    nextBank.splice(idx, 1);
  }
  const previousEquipped = state.equippedGear[target.slot];
  const finalBank = previousEquipped ? stackGearList([...nextBank, { ...previousEquipped, count: 1 }]) : nextBank;
  const nextEquipped: EquippedGearMap = { ...state.equippedGear, [target.slot]: singleEquip };
  const nextProfile: SurveyorProfile = { ...state.profile, bankedGear: finalBank, equippedGear: nextEquipped };
  const computed = computePlayerMaxStats(state.player.level, state.player.stats, nextEquipped, nextProfile.slotUpgradeLevels, nextProfile.activeSkin);
  return {
    ...state,
    profile: nextProfile,
    equippedGear: nextEquipped,
    player: { ...state.player, maxHealth: computed.maxHealth, health: Math.min(computed.maxHealth, state.player.health), maxStamina: computed.maxStamina },
  };
}

export function equipBestGearFromBank(state: DeepSignalRun): DeepSignalRun {
  let current = state;
  for (const slot of ALL_GEAR_SLOTS) {
    const candidates = current.profile.bankedGear.filter((i) => i.slot === slot);
    if (candidates.length === 0) continue;
    const bestBank = [...candidates].sort((a, b) => {
      const scoreA = a.power * Math.pow(1.28, a.ascensionRank);
      const scoreB = b.power * Math.pow(1.28, b.ascensionRank);
      return scoreB - scoreA;
    }).at(0)!;
    const equipped = current.equippedGear[slot];
    const eqScore = equipped ? equipped.power * Math.pow(1.28, equipped.ascensionRank) : -1;
    const bankScore = bestBank.power * Math.pow(1.28, bestBank.ascensionRank);
    if (bankScore > eqScore) {
      current = equipBankItem(current, bestBank.id);
    }
  }
  return current;
}

export function unequipAllSlotsToBank(state: DeepSignalRun): DeepSignalRun {
  const returned: GearItem[] = [];
  const nextEquipped: EquippedGearMap = { ...state.equippedGear };
  for (const slot of ALL_GEAR_SLOTS) {
    if (nextEquipped[slot]) {
      returned.push({ ...nextEquipped[slot]!, count: 1 });
      nextEquipped[slot] = undefined;
    }
  }
  if (returned.length === 0) return state;
  const nextBank = stackGearList([...state.profile.bankedGear, ...returned]);
  const nextProfile: SurveyorProfile = { ...state.profile, bankedGear: nextBank, equippedGear: nextEquipped };
  const computed = computePlayerMaxStats(state.player.level, state.player.stats, nextEquipped, nextProfile.slotUpgradeLevels, nextProfile.activeSkin);
  return {
    ...state,
    profile: nextProfile,
    equippedGear: nextEquipped,
    player: { ...state.player, maxHealth: computed.maxHealth, health: Math.min(computed.maxHealth, state.player.health), maxStamina: computed.maxStamina },
  };
}

export function fuseGearStackInVault(state: DeepSignalRun, bankItemId: string): DeepSignalRun {
  const idx = state.profile.bankedGear.findIndex((i) => i.id === bankItemId);
  if (idx < 0) return state;
  const target = state.profile.bankedGear.at(idx)!;
  if (target.count < ASCENSION_MERGE_COUNT) return state;

  const nextBank = [...state.profile.bankedGear];
  if (target.count === ASCENSION_MERGE_COUNT) {
    nextBank.splice(idx, 1);
  } else {
    nextBank[idx] = { ...target, count: target.count - ASCENSION_MERGE_COUNT };
  }
  const ascended: GearItem = { ...target, id: "gear-asc-" + Date.now().toString(36) + "-" + nextEntityId++, count: 1, ascensionRank: target.ascensionRank + 1 };
  const mergedBank = stackGearList([...nextBank, ascended]);
  return {
    ...state,
    profile: { ...state.profile, bankedGear: mergedBank, totalItemsMerged: state.profile.totalItemsMerged + 1 },
    lastAscensionResult: { itemName: ascended.name, newRank: ascended.ascensionRank, copiesUsed: ASCENSION_MERGE_COUNT },
  };
}

export function fuseEquippedWithVaultCopies(state: DeepSignalRun, slot: GearSlot): DeepSignalRun {
  const equipped = state.equippedGear[slot];
  if (!equipped) return state;
  const idx = state.profile.bankedGear.findIndex(
    (b) => b.slot === equipped.slot && b.baseKey === equipped.baseKey && b.rarity === equipped.rarity && b.ascensionRank === equipped.ascensionRank,
  );
  if (idx < 0) return state;
  const vaultStack = state.profile.bankedGear.at(idx)!;
  const neededFromVault = ASCENSION_MERGE_COUNT - 1;
  if (vaultStack.count < neededFromVault) return state;

  const nextBank = [...state.profile.bankedGear];
  if (vaultStack.count === neededFromVault) {
    nextBank.splice(idx, 1);
  } else {
    nextBank[idx] = { ...vaultStack, count: vaultStack.count - neededFromVault };
  }
  const ascendedEquipped: GearItem = { ...equipped, ascensionRank: equipped.ascensionRank + 1 };
  const nextEquipped: EquippedGearMap = { ...state.equippedGear, [slot]: ascendedEquipped };
  const nextProfile: SurveyorProfile = { ...state.profile, bankedGear: nextBank, equippedGear: nextEquipped, totalItemsMerged: state.profile.totalItemsMerged + 1 };
  const computed = computePlayerMaxStats(state.player.level, state.player.stats, nextEquipped, nextProfile.slotUpgradeLevels, nextProfile.activeSkin);
  return {
    ...state,
    profile: nextProfile,
    equippedGear: nextEquipped,
    player: { ...state.player, maxHealth: computed.maxHealth, health: Math.min(computed.maxHealth, state.player.health), maxStamina: computed.maxStamina },
    lastAscensionResult: { itemName: ascendedEquipped.name, newRank: ascendedEquipped.ascensionRank, copiesUsed: ASCENSION_MERGE_COUNT },
  };
}

export function getGearSellValue(item: GearItem): number {
  const rankMult = RARITY_RANK[item.rarity];
  return Math.round((8 + item.power * 3) * rankMult * Math.pow(2.4, item.ascensionRank));
}

export function sellBankItemStack(state: DeepSignalRun, bankItemId: string, quantity = 1): DeepSignalRun {
  const idx = state.profile.bankedGear.findIndex((i) => i.id === bankItemId);
  if (idx < 0) return state;
  const target = state.profile.bankedGear.at(idx)!;
  const sellCount = Math.min(target.count, Math.max(1, quantity));
  const goldGain = getGearSellValue(target) * sellCount;
  const nextBank = [...state.profile.bankedGear];
  if (target.count <= sellCount) {
    nextBank.splice(idx, 1);
  } else {
    nextBank[idx] = { ...target, count: target.count - sellCount };
  }
  return { ...state, profile: { ...state.profile, gold: state.profile.gold + goldGain, bankedGear: nextBank } };
}

export function sellFilteredBankItems(state: DeepSignalRun, rarityFilter: GearRarity | "ALL"): DeepSignalRun {
  let goldGain = 0;
  const kept: GearItem[] = [];
  for (const item of state.profile.bankedGear) {
    if (rarityFilter === "ALL" || item.rarity === rarityFilter) {
      goldGain += getGearSellValue(item) * item.count;
    } else {
      kept.push(item);
    }
  }
  if (goldGain === 0) return state;
  return { ...state, profile: { ...state.profile, gold: state.profile.gold + goldGain, bankedGear: kept } };
}

export function selectSurveyorSkin(state: DeepSignalRun, skinId: string): DeepSignalRun {
  const unlocked = state.profile.unlockedSkins.includes(skinId) ? state.profile.unlockedSkins : [...state.profile.unlockedSkins, skinId];
  return { ...state, profile: { ...state.profile, unlockedSkins: unlocked, activeSkin: skinId } };
}

export const continueOverdriveAfterEnding = enterOverdriveEndless;
export const extractWithLoot = extractFromCave;

export function getBaseCopiesEquivalent(ascensionRank: number): number {
  return Math.pow(ASCENSION_MERGE_COUNT, Math.max(0, ascensionRank));
}

export function setSurveyorSkin(profile: SurveyorProfile, skinId: string): SurveyorProfile {
  const unlocked = profile.unlockedSkins.includes(skinId) ? profile.unlockedSkins : [...profile.unlockedSkins, skinId];
  return { ...profile, unlockedSkins: unlocked, activeSkin: skinId };
}

export function equipFromBankToSlot(profile: SurveyorProfile, bankItemId: string): SurveyorProfile {
  const dummy = createDeepSignalRun(profile);
  return equipBankItem(dummy, bankItemId).profile;
}

export function unequipSlotToBank(profile: SurveyorProfile, slot: GearSlot): SurveyorProfile {
  const equipped = profile.equippedGear[slot];
  if (!equipped) return profile;
  const nextEquipped = { ...profile.equippedGear, [slot]: undefined };
  return { ...profile, equippedGear: nextEquipped, bankedGear: stackGearList([...profile.bankedGear, { ...equipped, count: 1 }]) };
}
