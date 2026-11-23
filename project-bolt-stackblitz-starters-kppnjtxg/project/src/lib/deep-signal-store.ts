export type GearRarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type GearSlot = "weapon" | "helmet" | "chestplate" | "pants" | "shoes" | "necklace" | "ring";
export type WeaponArchetype =
  | "Sword"
  | "Rapier"
  | "Broadsword"
  | "Plasma Cleaver"
  | "Executioner";

export type GearItem = {
  id: string;
  baseKey: string;
  name: string;
  rarity: GearRarity;
  slot: GearSlot;
  count: number;
  power: number;
  attackBonus: number;
  healthBonus: number;
  guardBonus: number;
  agilityBonus: number;
  weaponType?: WeaponArchetype;
  ascensionRank: number; // 0, 1, 2, 3... (each rank requires 3 of the previous rank: 3, 9, 27, 81...)
};

export type EquippedGearMap = Partial<Record<GearSlot, GearItem>>;
export type SlotUpgradeMap = Record<GearSlot, number>;

export type SurveyorStats = {
  damagePoints: number;
  healthPoints: number;
  agilityPoints: number;
};

export type SurveyorProfile = {
  version: 5;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  diamonds: number;
  stats: SurveyorStats;
  slotUpgradeLevels: SlotUpgradeMap;
  bankedGear: GearItem[];
  equippedGear: EquippedGearMap;
  discoveredItems: string[]; // Tracks baseKeys for the 105-item Index
  unlockedSignalLinks: number[];
  decodedTapes: string[];
  discoveredEnemies: string[];
  unlockedSkins: string[];
  activeSkin: string;
  deepestFloor: number;
  totalExtractions: number;
  introWatched: boolean;
  checksum?: string;
};

export const VAULT_PAGE_SIZE = 64; // 8x8 grid per page
export const VAULT_TOTAL_PAGES = 4; // 4 pages = 256 total stack slots
export const MAX_INVENTORY_SLOTS = VAULT_PAGE_SIZE * VAULT_TOTAL_PAGES;
export const MAX_STACK_SIZE = 9999;
export const ASCENSION_MERGE_COUNT = 3; // 3 of Rank N -> 1 of Rank N+1 (3, 9, 27, 81...)
export const MAX_SLOT_UPGRADE_LEVEL = 250;

const LEGACY_V1_KEY = "jb-playnet-deep-signal-gear-v1";
const LEGACY_V2_KEY = "jb-playnet-deep-signal-profile-v2";
const LEGACY_V3_KEY = "jb-playnet-deep-signal-profile-v3";
const LEGACY_V4_KEY = "jb-playnet-deep-signal-profile-v4";
const PROFILE_V5_KEY = "jb-playnet-deep-signal-profile-v5";

export const ALL_GEAR_SLOTS: GearSlot[] = [
  "weapon",
  "helmet",
  "chestplate",
  "pants",
  "shoes",
  "necklace",
  "ring",
];

const RARITIES = new Set<GearRarity>(["Common", "Uncommon", "Rare", "Epic", "Legendary"]);
const SLOTS = new Set<GearSlot>(ALL_GEAR_SLOTS);
const WEAPON_TYPES = new Set<WeaponArchetype>([
  "Sword",
  "Rapier",
  "Broadsword",
  "Plasma Cleaver",
  "Executioner",
]);

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== "number" || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

export function createDefaultSlotUpgrades(): SlotUpgradeMap {
  return {
    weapon: 1,
    helmet: 1,
    chestplate: 1,
    pants: 1,
    shoes: 1,
    necklace: 1,
    ring: 1,
  };
}

function normalizeSlotUpgrades(raw: unknown): SlotUpgradeMap {
  const base = createDefaultSlotUpgrades();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Partial<Record<GearSlot, unknown>>;
  for (const slot of ALL_GEAR_SLOTS) {
    base[slot] = clampInt(obj[slot], 1, MAX_SLOT_UPGRADE_LEVEL, 1);
  }
  return base;
}

function computeIntegrityHash(profile: Omit<SurveyorProfile, "checksum">): string {
  const sig = [
    profile.level,
    profile.gold,
    profile.diamonds,
    profile.stats.damagePoints,
    profile.stats.healthPoints,
    profile.stats.agilityPoints,
    profile.deepestFloor,
    ALL_GEAR_SLOTS.map((s) => `${s}:${profile.slotUpgradeLevels[s]}`).join(","),
    profile.bankedGear
      .map((g) => `${g.baseKey}:${g.rarity}:${g.count}:${g.ascensionRank}`)
      .join("|"),
    ALL_GEAR_SLOTS.map((s) => {
      const eq = profile.equippedGear[s];
      return eq ? `${s}=${eq.baseKey}:${eq.rarity}:${eq.ascensionRank}` : `${s}=none`;
    }).join("|"),
  ].join("#");

  let hash = 2166136261;
  for (let i = 0; i < sig.length; i++) {
    hash ^= sig.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function normalizeGearItem(raw: unknown): GearItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<GearItem> & { fusionLevel?: number };
  if (typeof item.id !== "string" || typeof item.name !== "string") return null;
  if (typeof item.rarity !== "string" || !RARITIES.has(item.rarity as GearRarity)) return null;

  let slotStr = item.slot as string;
  if (slotStr === "shell") slotStr = "chestplate";
  else if (slotStr === "module") slotStr = "pants";
  else if (slotStr === "jewelry") slotStr = "necklace";
  if (!SLOTS.has(slotStr as GearSlot)) return null;
  const slot = slotStr as GearSlot;

  const weaponType =
    typeof item.weaponType === "string" && WEAPON_TYPES.has(item.weaponType as WeaponArchetype)
      ? (item.weaponType as WeaponArchetype)
      : undefined;

  const baseKey =
    typeof item.baseKey === "string" && item.baseKey.length > 0
      ? item.baseKey
      : `${slot}:${item.rarity.toLowerCase()}:${item.name.toLowerCase()}`;

  const rawAscension =
    typeof item.ascensionRank === "number"
      ? item.ascensionRank
      : typeof item.fusionLevel === "number"
        ? item.fusionLevel
        : 0;

  const ascensionRank = clampInt(rawAscension, 0, 99, 0);
  const count = clampInt(item.count, 1, MAX_STACK_SIZE, 1);
  const power = clampInt(item.power, 1, 5000, 4);

  return {
    id: item.id,
    baseKey,
    name: item.name,
    rarity: item.rarity as GearRarity,
    slot,
    count,
    power,
    attackBonus: clampInt(item.attackBonus, 0, 50000, 0),
    healthBonus: clampInt(item.healthBonus, 0, 100000, 0),
    guardBonus: clampInt(item.guardBonus, 0, 50000, 0),
    agilityBonus: clampInt(item.agilityBonus, 0, 5000, 0),
    weaponType,
    ascensionRank,
  };
}

export function isGearItem(value: unknown): value is GearItem {
  return normalizeGearItem(value) !== null;
}

export function stackGearList(items: GearItem[]): GearItem[] {
  const result: GearItem[] = [];
  for (const rawItem of items) {
    const item = normalizeGearItem(rawItem);
    if (!item) continue;

    let remaining = item.count;
    for (const existing of result) {
      if (
        remaining > 0 &&
        existing.slot === item.slot &&
        existing.baseKey === item.baseKey &&
        existing.rarity === item.rarity &&
        existing.ascensionRank === item.ascensionRank &&
        existing.count < MAX_STACK_SIZE
      ) {
        const space = MAX_STACK_SIZE - existing.count;
        const add = Math.min(space, remaining);
        existing.count += add;
        remaining -= add;
      }
    }

    while (remaining > 0 && result.length < MAX_INVENTORY_SLOTS) {
      const batch = Math.min(MAX_STACK_SIZE, remaining);
      result.push({
        ...item,
        id: result.some((r) => r.id === item.id) ? `${item.id}-${result.length}` : item.id,
        count: batch,
      });
      remaining -= batch;
    }
  }
  return result;
}

export function createStarterCommonLoadout(): EquippedGearMap {
  return {
    weapon: {
      id: "starter-weapon-trench-blade",
      baseKey: "weapon:Common:rusted trench blade",
      name: "Rusted Trench Blade",
      rarity: "Common",
      slot: "weapon",
      count: 1,
      power: 4,
      attackBonus: 10,
      healthBonus: 0,
      guardBonus: 0,
      agilityBonus: 0,
      weaponType: "Sword",
      ascensionRank: 0,
    },
    helmet: {
      id: "starter-helmet-visor",
      baseKey: "helmet:Common:scout visor",
      name: "Scout Visor",
      rarity: "Common",
      slot: "helmet",
      count: 1,
      power: 3,
      attackBonus: 0,
      healthBonus: 18,
      guardBonus: 12,
      agilityBonus: 0,
      ascensionRank: 0,
    },
    chestplate: {
      id: "starter-chest-vest",
      baseKey: "chestplate:Common:composite vest",
      name: "Composite Vest",
      rarity: "Common",
      slot: "chestplate",
      count: 1,
      power: 3,
      attackBonus: 0,
      healthBonus: 32,
      guardBonus: 0,
      agilityBonus: 0,
      ascensionRank: 0,
    },
    pants: {
      id: "starter-pants-greaves",
      baseKey: "pants:Common:reinforced greaves",
      name: "Reinforced Greaves",
      rarity: "Common",
      slot: "pants",
      count: 1,
      power: 3,
      attackBonus: 0,
      healthBonus: 20,
      guardBonus: 16,
      agilityBonus: 0,
      ascensionRank: 0,
    },
    shoes: {
      id: "starter-shoes-boots",
      baseKey: "shoes:Common:tread boots",
      name: "Tread Boots",
      rarity: "Common",
      slot: "shoes",
      count: 1,
      power: 3,
      attackBonus: 0,
      healthBonus: 0,
      guardBonus: 0,
      agilityBonus: 4,
      ascensionRank: 0,
    },
  };
}

function collectDiscoveredKeys(
  existing: string[],
  banked: GearItem[],
  equipped: EquippedGearMap,
): string[] {
  const set = new Set<string>(existing);
  for (const g of banked) set.add(g.baseKey);
  for (const slot of ALL_GEAR_SLOTS) {
    const eq = equipped[slot];
    if (eq) set.add(eq.baseKey);
  }
  return Array.from(set);
}

export function createDefaultSurveyorProfile(initialGear: GearItem[] = []): SurveyorProfile {
  const starter = createStarterCommonLoadout();
  const stacked = stackGearList(initialGear);
  const base: Omit<SurveyorProfile, "checksum"> = {
    version: 5,
    level: 1,
    xp: 0,
    xpToNext: 180,
    gold: 60,
    diamonds: 0,
    stats: {
      damagePoints: 0,
      healthPoints: 0,
      agilityPoints: 0,
    },
    slotUpgradeLevels: createDefaultSlotUpgrades(),
    bankedGear: stacked,
    equippedGear: starter,
    discoveredItems: collectDiscoveredKeys([], stacked, starter),
    unlockedSignalLinks: Array.of(1),
    decodedTapes: [],
    discoveredEnemies: [],
    unlockedSkins: Array.of("standard-issue"),
    activeSkin: "standard-issue",
    deepestFloor: 1,
    totalExtractions: 0,
    introWatched: false,
  };
  return { ...base, checksum: computeIntegrityHash(base) };
}


function sanitizeNumberArray(input: unknown, fallback: number[]): number[] {
  if (!Array.isArray(input)) return fallback;
  const clean = input.filter((n): n is number => typeof n === "number" && Number.isFinite(n) && n >= 1 && n <= 9999);
  return clean.length > 0 ? Array.from(new Set(clean)).sort((a, b) => a - b) : fallback;
}

function sanitizeStringArray(input: unknown, fallback: string[]): string[] {
  if (!Array.isArray(input)) return fallback;
  const clean = input.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= 96);
  return clean.length > 0 ? Array.from(new Set(clean)) : fallback;
}

export function loadSurveyorProfile(): SurveyorProfile {
  if (typeof window === "undefined") return createDefaultSurveyorProfile();

  try {
    const rawV5 = window.localStorage.getItem(PROFILE_V5_KEY);
    if (rawV5) {
      const parsed = JSON.parse(rawV5) as Partial<SurveyorProfile>;
      const bankedGear = stackGearList(Array.isArray(parsed.bankedGear) ? (parsed.bankedGear as GearItem[]) : []);
      const equippedGear: EquippedGearMap = {};
      if (parsed.equippedGear && typeof parsed.equippedGear === "object") {
        for (const slot of ALL_GEAR_SLOTS) {
          const norm = normalizeGearItem(parsed.equippedGear[slot]);
          if (norm && norm.slot === slot) {
            equippedGear[slot] = { ...norm, count: 1 };
          }
        }
      }

      const rawStats = parsed.stats;
      const stats: SurveyorStats = {
        damagePoints: clampInt(rawStats?.damagePoints, 0, 999, 0),
        healthPoints: clampInt(rawStats?.healthPoints, 0, 999, 0),
        agilityPoints: clampInt(rawStats?.agilityPoints, 0, 999, 0),
      };

      const unlockedSkins = sanitizeStringArray(parsed.unlockedSkins, Array.of("standard-issue"));
      const activeSkin =
        typeof parsed.activeSkin === "string" && unlockedSkins.includes(parsed.activeSkin)
          ? parsed.activeSkin
          : unlockedSkins.at(0) ?? "standard-issue";

      const discoveredItems = collectDiscoveredKeys(
        sanitizeStringArray(parsed.discoveredItems, []),
        bankedGear,
        equippedGear,
      );

      const rebuilt: Omit<SurveyorProfile, "checksum"> = {
        version: 5,
        level: clampInt(parsed.level, 1, 999, 1),
        xp: clampInt(parsed.xp, 0, 9999999, 0),
        xpToNext: clampInt(parsed.xpToNext, 100, 9999999, 180),
        gold: clampInt(parsed.gold, 0, 99999999, 60),
        diamonds: clampInt(parsed.diamonds, 0, 9999999, 0),
        stats,
        slotUpgradeLevels: normalizeSlotUpgrades(parsed.slotUpgradeLevels),
        bankedGear,
        equippedGear,
        discoveredItems,
        unlockedSignalLinks: sanitizeNumberArray(parsed.unlockedSignalLinks, Array.of(1)),
        decodedTapes: sanitizeStringArray(parsed.decodedTapes, []),
        discoveredEnemies: sanitizeStringArray(parsed.discoveredEnemies, []),
        unlockedSkins,
        activeSkin,
        deepestFloor: clampInt(parsed.deepestFloor, 1, 9999, 1),
        totalExtractions: clampInt(parsed.totalExtractions, 0, 999999, 0),
        introWatched: Boolean(parsed.introWatched),
      };

      return { ...rebuilt, checksum: computeIntegrityHash(rebuilt) };
    }

    const rawPrev =
      window.localStorage.getItem(LEGACY_V4_KEY) ??
      window.localStorage.getItem(LEGACY_V3_KEY) ??
      window.localStorage.getItem(LEGACY_V2_KEY) ??
      window.localStorage.getItem(LEGACY_V1_KEY);

    if (rawPrev) {
      const parsed = JSON.parse(rawPrev) as Partial<SurveyorProfile>;
      const base = createDefaultSurveyorProfile(Array.isArray(parsed.bankedGear) ? (parsed.bankedGear as GearItem[]) : []);
      const migratedEquipped: EquippedGearMap = { ...base.equippedGear };
      const migratedSlotLevels = createDefaultSlotUpgrades();

      if (parsed.equippedGear && typeof parsed.equippedGear === "object") {
        for (const slot of ALL_GEAR_SLOTS) {
          const rawSlotItem = parsed.equippedGear[slot] as (GearItem & { upgradeLevel?: number }) | undefined;
          if (rawSlotItem && typeof rawSlotItem.upgradeLevel === "number") {
            migratedSlotLevels[slot] = clampInt(rawSlotItem.upgradeLevel, 1, MAX_SLOT_UPGRADE_LEVEL, 1);
          }
          const norm = normalizeGearItem(rawSlotItem);
          if (norm && norm.slot === slot) {
            migratedEquipped[slot] = { ...norm, count: 1 };
          }
        }
      }

      const migrated: Omit<SurveyorProfile, "checksum"> = {
        ...base,
        level: clampInt(parsed.level, 1, 999, 1),
        xp: clampInt(parsed.xp, 0, 9999999, 0),
        xpToNext: clampInt(parsed.xpToNext, 100, 9999999, 180),
        gold: clampInt(parsed.gold, 0, 99999999, 60),
        diamonds: clampInt(parsed.diamonds, 0, 9999999, 0),
        stats: {
          damagePoints: clampInt(parsed.stats?.damagePoints, 0, 999, 0),
          healthPoints: clampInt(parsed.stats?.healthPoints, 0, 999, 0),
          agilityPoints: clampInt(parsed.stats?.agilityPoints, 0, 999, 0),
        },
        slotUpgradeLevels: migratedSlotLevels,
        equippedGear: migratedEquipped,
        discoveredItems: collectDiscoveredKeys([], base.bankedGear, migratedEquipped),
        unlockedSignalLinks: sanitizeNumberArray(parsed.unlockedSignalLinks, Array.of(1)),
        decodedTapes: sanitizeStringArray(parsed.decodedTapes, []),
        discoveredEnemies: sanitizeStringArray(parsed.discoveredEnemies, []),
        unlockedSkins: sanitizeStringArray(parsed.unlockedSkins, Array.of("standard-issue")),
        activeSkin: typeof parsed.activeSkin === "string" ? parsed.activeSkin : "standard-issue",
        deepestFloor: clampInt(parsed.deepestFloor, 1, 9999, 1),
        totalExtractions: clampInt(parsed.totalExtractions, 0, 999999, 0),
        introWatched: Boolean(parsed.introWatched),
      };
      const finalProfile = { ...migrated, checksum: computeIntegrityHash(migrated) };
      saveSurveyorProfile(finalProfile);
      return finalProfile;
    }
  } catch {
    return createDefaultSurveyorProfile();
  }

  const fresh = createDefaultSurveyorProfile();
  saveSurveyorProfile(fresh);
  return fresh;
}

export function saveSurveyorProfile(profile: SurveyorProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cleanBank = stackGearList(profile.bankedGear);
    const cleanEquipped: EquippedGearMap = {};
    for (const slot of ALL_GEAR_SLOTS) {
      const norm = normalizeGearItem(profile.equippedGear[slot]);
      if (norm && norm.slot === slot) {
        cleanEquipped[slot] = { ...norm, count: 1 };
      }
    }
    const base: Omit<SurveyorProfile, "checksum"> = {
      ...profile,
      version: 5,
      slotUpgradeLevels: normalizeSlotUpgrades(profile.slotUpgradeLevels),
      bankedGear: cleanBank,
      equippedGear: cleanEquipped,
      discoveredItems: collectDiscoveredKeys(profile.discoveredItems ?? [], cleanBank, cleanEquipped),
    };
    const toSave: SurveyorProfile = {
      ...base,
      checksum: computeIntegrityHash(base),
    };
    window.localStorage.setItem(PROFILE_V5_KEY, JSON.stringify(toSave));
    return true;
  } catch {
    return false;
  }
}

export function resetSurveyorProfile(): SurveyorProfile {
  const fresh = createDefaultSurveyorProfile();
  saveSurveyorProfile(fresh);
  return fresh;
}

export function loadBankedGear(): GearItem[] {
  return loadSurveyorProfile().bankedGear;
}

export function saveBankedGear(items: GearItem[]): boolean {
  const profile = loadSurveyorProfile();
  return saveSurveyorProfile({
    ...profile,
    bankedGear: stackGearList(items),
  });
}
