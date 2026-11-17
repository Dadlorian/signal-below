import type { GearItem } from "./deep-signal-engine";

const STORAGE_KEY = "jb-playnet-deep-signal-gear-v1";
const RARITIES = new Set(["Common", "Uncommon", "Rare", "Epic", "Legendary"]);
const SLOTS = new Set(["weapon", "shell", "module"]);

function isGearItem(value: unknown): value is GearItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<GearItem>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.rarity === "string" &&
    RARITIES.has(item.rarity) &&
    typeof item.slot === "string" &&
    SLOTS.has(item.slot) &&
    typeof item.power === "number" &&
    typeof item.attackBonus === "number" &&
    typeof item.healthBonus === "number" &&
    typeof item.guardBonus === "number"
  );
}

export function loadBankedGear(): GearItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isGearItem) : [];
  } catch {
    return [];
  }
}

export function saveBankedGear(items: GearItem[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter(isGearItem)));
    return true;
  } catch {
    return false;
  }
}
