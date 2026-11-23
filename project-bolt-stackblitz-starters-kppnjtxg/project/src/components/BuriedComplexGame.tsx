import { useEffect, useRef, useState } from "react";
import { deepSignalAudio } from "../lib/deep-signal-audio";
import {
  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  ENEMY_LORE_CODEX,
  FULL_ITEM_CATALOG,
  MAX_SLOT_UPGRADE_LEVEL,
  RARITY_RANK,
  SIGNAL_TAPES_DB,
  VAULT_PAGE_SIZE,
  VAULT_TOTAL_PAGES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  acknowledgeBossLore,
  buyDiamondShopOffer,
  computePlayerMaxStats,
  continueOverdriveAfterEnding,
  createDeepSignalRun,
  descendToNextFloor,
  equipBestGearFromBank,
  equipFromBankToSlot,
  extractWithLoot,
  fuseEquippedWithVaultCopies,
  fuseGearStackInVault,
  getBaseCopiesEquivalent,
  getBossSpecForFloor,
  getEffectiveGearStats,
  getItemSellValue,
  getMultiSlotUpgradePlan,
  sellBankItemStack,
  sellFilteredBankItems,
  setSurveyorSkin,
  startDeepSignalRun,
  stepDeepSignalRun,
  unequipAllSlotsToBank,
  unequipSlotToBank,
  upgradeEquippedSlotBulkWithGold,
  type BossSpec,
  type DeepSignalRun,
  type Enemy,
  type GearItem,
  type GearRarity,
  type GearSlot,
  type PlayerInput,
  type RoomBlocker,
  type WeaponArchetype,
} from "../lib/deep-signal-engine";
import {
  loadSurveyorProfile,
  resetSurveyorProfile,
  saveSurveyorProfile,
  type SurveyorProfile,
} from "../lib/deep-signal-store";

type KeyMap = Record<string, boolean>;

export type SkinTheme = {
  id: string;
  name: string;
  unlockNote: string;
  body: string;
  bodyShadow: string;
  visor: string;
  visorGlow: string;
  trim: string;
};

export const SURVEYOR_SKINS: SkinTheme[] = [
  {
    id: "standard-issue",
    name: "STANDARD SURVEYOR",
    unlockNote: "Default Sub-Level Expedition Suit",
    body: "#6fe3c1",
    bodyShadow: "#2b6e5c",
    visor: "#d8fff3",
    visorGlow: "rgba(111, 227, 193, 0.35)",
    trim: "#1f3d35",
  },
  {
    id: "cryo-surveyor",
    name: "CRYO-CONDUIT RIG",
    unlockNote: "Extract from Floor 20+",
    body: "#63d2ff",
    bodyShadow: "#215a78",
    visor: "#e0f7ff",
    visorGlow: "rgba(99, 210, 255, 0.4)",
    trim: "#153245",
  },
  {
    id: "void-walker",
    name: "ARCHIVE PHANTOM",
    unlockNote: "Extract from Floor 50+",
    body: "#b69cff",
    bodyShadow: "#4a3782",
    visor: "#f3edff",
    visorGlow: "rgba(182, 156, 255, 0.42)",
    trim: "#261c45",
  },
  {
    id: "sovereign-gold",
    name: "SOVEREIGN PRIME",
    unlockNote: "Extract from Floor 100+",
    body: "#ffcf56",
    bodyShadow: "#8c6514",
    visor: "#fff8db",
    visorGlow: "rgba(255, 207, 86, 0.45)",
    trim: "#422f08",
  },
];

const RARITY_STYLES: Record<GearRarity, { border: string; bg: string; text: string; hex: string }> = {
  Common: {
    border: "border-[#637870]",
    bg: "bg-[#141f1c]",
    text: "text-[#c4d6cf]",
    hex: "#9eb3ab",
  },
  Uncommon: {
    border: "border-[#54c496]",
    bg: "bg-[#11261f]",
    text: "text-[#79f2cc]",
    hex: "#6fe3c1",
  },
  Rare: {
    border: "border-[#57a6ff]",
    bg: "bg-[#112033]",
    text: "text-[#7cc0ff]",
    hex: "#63b3ff",
  },
  Epic: {
    border: "border-[#b87aff]",
    bg: "bg-[#201333]",
    text: "text-[#d4a8ff]",
    hex: "#b87aff",
  },
  Legendary: {
    border: "border-[#ffcf56]",
    bg: "bg-[#2b200e]",
    text: "text-[#ffe082]",
    hex: "#ffcf56",
  },
};

const SLOT_LABELS: Record<GearSlot, string> = {
  weapon: "WEAPON",
  helmet: "HELMET",
  chestplate: "CHEST",
  pants: "PANTS",
  shoes: "BOOTS",
  necklace: "NECK",
  ring: "RING",
};

function getSkinTheme(skinId: string): SkinTheme {
  return SURVEYOR_SKINS.find((s) => s.id === skinId) ?? SURVEYOR_SKINS.at(0)!;
}

function getWeaponPalette(rarity?: GearRarity) {
  switch (rarity) {
    case "Legendary":
      return { blade: "#ffe082", edge: "#fff8db", hilt: "#a66c14" };
    case "Epic":
      return { blade: "#c994ff", edge: "#f2e3ff", hilt: "#562b85" };
    case "Rare":
      return { blade: "#7cc0ff", edge: "#e3f2ff", hilt: "#244e80" };
    case "Uncommon":
      return { blade: "#79f2cc", edge: "#e0fff5", hilt: "#1f614d" };
    default:
      return { blade: "#b8c7c1", edge: "#eef7f3", hilt: "#4a5953" };
  }
}

function drawPixelWeapon(
  ctx: CanvasRenderingContext2D,
  weaponType: WeaponArchetype | undefined,
  rarity: GearRarity | undefined,
  swinging: boolean,
) {
  const pal = getWeaponPalette(rarity);
  const type = weaponType ?? "Sword";
  ctx.save();
  ctx.rotate(swinging ? -0.55 : 0.2);

  ctx.fillStyle = pal.hilt;
  ctx.fillRect(6, -2, 5, 4);
  ctx.fillStyle = "#e8f2ee";
  ctx.fillRect(10, -5, 2, 10);

  if (type === "Rapier") {
    ctx.fillStyle = pal.blade;
    ctx.fillRect(12, -1, 18, 2);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(12, -1, 18, 1);
  } else if (type === "Broadsword") {
    ctx.fillStyle = pal.blade;
    ctx.fillRect(12, -3, 16, 6);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(12, -3, 16, 2);
  } else if (type === "Plasma Cleaver") {
    ctx.fillStyle = "#2b383d";
    ctx.fillRect(12, -2, 15, 4);
    ctx.fillStyle = pal.blade;
    ctx.fillRect(13, -5, 16, 3);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(13, -5, 16, 1);
  } else if (type === "Executioner") {
    ctx.fillStyle = pal.blade;
    ctx.fillRect(12, -4, 18, 8);
    ctx.fillRect(26, -6, 5, 12);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(12, -4, 19, 2);
  } else {
    ctx.fillStyle = pal.blade;
    ctx.fillRect(12, -2, 15, 4);
    ctx.fillStyle = pal.edge;
    ctx.fillRect(12, -2, 15, 1);
  }
  ctx.restore();
}
export function PixelGearIcon({
  slot,
  rarity,
  weaponType,
  size = 28,
}: {
  slot: GearSlot;
  rarity: GearRarity;
  weaponType?: WeaponArchetype;
  size?: number;
}) {
  const pal = getWeaponPalette(rarity);
  const isHighTier = rarity === "Epic" || rarity === "Legendary";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="shrink-0"
      aria-hidden="true"
    >
      {isHighTier && (
        <rect x="2" y="2" width="12" height="12" fill={pal.blade} fillOpacity="0.14" />
      )}

      {slot === "weapon" && (
        <>
          {weaponType === "Rapier" ? (
            <>
              <rect x="12" y="2" width="2" height="2" fill={pal.edge} />
              <rect x="10" y="4" width="2" height="2" fill={pal.edge} />
              <rect x="8" y="6" width="2" height="2" fill={pal.blade} />
              <rect x="6" y="8" width="2" height="2" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="1" fill="#e8f2ee" />
              <rect x="6" y="11" width="1" height="3" fill="#e8f2ee" />
              <rect x="3" y="11" width="2" height="2" fill={pal.hilt} />
            </>
          ) : weaponType === "Broadsword" ? (
            <>
              <rect x="11" y="2" width="3" height="3" fill={pal.edge} />
              <rect x="9" y="4" width="3" height="3" fill={pal.blade} />
              <rect x="7" y="6" width="3" height="3" fill={pal.blade} />
              <rect x="5" y="8" width="3" height="3" fill={pal.blade} />
              <rect x="10" y="3" width="2" height="2" fill={pal.edge} />
              <rect x="8" y="5" width="2" height="2" fill={pal.edge} />
              <rect x="3" y="8" width="5" height="2" fill="#e8f2ee" />
              <rect x="6" y="10" width="2" height="4" fill="#e8f2ee" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          ) : weaponType === "Plasma Cleaver" ? (
            <>
              <rect x="9" y="2" width="5" height="2" fill={pal.edge} />
              <rect x="7" y="4" width="6" height="2" fill={pal.blade} />
              <rect x="5" y="6" width="6" height="3" fill={pal.blade} />
              <rect x="4" y="8" width="4" height="2" fill="#32464f" />
              <rect x="2" y="11" width="3" height="3" fill={pal.hilt} />
              <rect x="11" y="3" width="2" height="2" fill="#ffffff" />
            </>
          ) : weaponType === "Executioner" ? (
            <>
              <rect x="10" y="1" width="5" height="5" fill={pal.blade} />
              <rect x="12" y="1" width="3" height="3" fill={pal.edge} />
              <rect x="8" y="4" width="4" height="4" fill={pal.blade} />
              <rect x="6" y="6" width="4" height="4" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="2" fill="#ffcf56" />
              <rect x="6" y="10" width="2" height="4" fill="#ffcf56" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          ) : (
            <>
              <rect x="11" y="2" width="3" height="2" fill={pal.edge} />
              <rect x="9" y="4" width="3" height="2" fill={pal.blade} />
              <rect x="7" y="6" width="3" height="2" fill={pal.blade} />
              <rect x="5" y="8" width="3" height="2" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="2" fill="#e8f2ee" />
              <rect x="6" y="10" width="2" height="4" fill="#e8f2ee" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          )}
        </>
      )}

      {slot === "helmet" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={pal.blade} />
          <rect x="3" y="4" width="10" height="7" fill={pal.blade} />
          <rect x="5" y="3" width="6" height="1" fill={pal.edge} />
          <rect x="4" y="6" width="8" height="3" fill="#0d1715" />
          <rect x="5" y="7" width="6" height="1" fill={pal.edge} />
          <rect x="4" y="11" width="3" height="2" fill={pal.hilt} />
          <rect x="9" y="11" width="3" height="2" fill={pal.hilt} />
        </>
      )}

      {slot === "chestplate" && (
        <>
          <rect x="3" y="3" width="3" height="3" fill={pal.edge} />
          <rect x="10" y="3" width="3" height="3" fill={pal.edge} />
          <rect x="4" y="4" width="8" height="8" fill={pal.blade} />
          <rect x="6" y="3" width="4" height="2" fill="#0d1715" />
          <rect x="6" y="6" width="4" height="3" fill={pal.hilt} />
          <rect x="7" y="7" width="2" height="2" fill={pal.edge} />
          <rect x="5" y="12" width="6" height="2" fill={pal.hilt} />
        </>
      )}

      {slot === "pants" && (
        <>
          <rect x="4" y="2" width="8" height="3" fill={pal.hilt} />
          <rect x="4" y="5" width="3" height="9" fill={pal.blade} />
          <rect x="9" y="5" width="3" height="9" fill={pal.blade} />
          <rect x="4" y="8" width="3" height="2" fill={pal.edge} />
          <rect x="9" y="8" width="3" height="2" fill={pal.edge} />
        </>
      )}

      {slot === "shoes" && (
        <>
          <rect x="2" y="4" width="4" height="7" fill={pal.blade} />
          <rect x="2" y="9" width="6" height="3" fill={pal.blade} />
          <rect x="2" y="12" width="6" height="2" fill={pal.hilt} />
          <rect x="9" y="4" width="4" height="7" fill={pal.blade} />
          <rect x="9" y="9" width="6" height="3" fill={pal.blade} />
          <rect x="9" y="12" width="6" height="2" fill={pal.hilt} />
          <rect x="3" y="6" width="2" height="2" fill={pal.edge} />
          <rect x="10" y="6" width="2" height="2" fill={pal.edge} />
        </>
      )}

      {slot === "necklace" && (
        <>
          <rect x="5" y="2" width="6" height="1" fill="#d8e8e2" />
          <rect x="4" y="3" width="1" height="4" fill="#d8e8e2" />
          <rect x="11" y="3" width="1" height="4" fill="#d8e8e2" />
          <rect x="5" y="7" width="1" height="2" fill="#d8e8e2" />
          <rect x="10" y="7" width="1" height="2" fill="#d8e8e2" />
          <rect x="6" y="8" width="4" height="5" fill={pal.hilt} />
          <rect x="7" y="9" width="2" height="3" fill={pal.edge} />
        </>
      )}

      {slot === "ring" && (
        <>
          <rect x="6" y="2" width="4" height="3" fill={pal.edge} />
          <rect x="7" y="2" width="2" height="1" fill="#ffffff" />
          <rect x="4" y="5" width="8" height="2" fill={pal.blade} />
          <rect x="3" y="7" width="2" height="4" fill={pal.blade} />
          <rect x="11" y="7" width="2" height="4" fill={pal.blade} />
          <rect x="4" y="11" width="8" height="2" fill={pal.hilt} />
          <rect x="5" y="13" width="6" height="1" fill={pal.blade} />
        </>
      )}
    </svg>
  );
}

export function drawPixelSurveyorSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  skinId: string,
  equipped: Partial<Record<GearSlot, GearItem>>,
  options?: {
    walkPhase?: number;
    guarding?: boolean;
    attacking?: boolean;
    invulnerable?: boolean;
  },
) {
  const skin = getSkinTheme(skinId);
  const walk = options?.walkPhase ?? 0;
  const bob = Math.abs(Math.sin(walk)) * 2;
  const stride = Math.sin(walk) * 3;
  const flip = facingX < -0.15 ? -1 : 1;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (options?.invulnerable && Math.floor(Date.now() / 65) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const pantsColor = equipped.pants
    ? RARITY_STYLES[equipped.pants.rarity].hex
    : skin.bodyShadow;
  const shoeColor = equipped.shoes
    ? RARITY_STYLES[equipped.shoes.rarity].hex
    : "#d8eee4";

  ctx.fillStyle = pantsColor;
  ctx.fillRect(-5, Math.round(4 - stride * 0.5), 4, 6);
  ctx.fillRect(1, Math.round(4 + stride * 0.5), 4, 6);

  ctx.fillStyle = shoeColor;
  ctx.fillRect(-6, Math.round(9 - stride * 0.5), 5, 3);
  ctx.fillRect(1, Math.round(9 + stride * 0.5), 5, 3);

  const chestColor = equipped.chestplate
    ? RARITY_STYLES[equipped.chestplate.rarity].hex
    : skin.body;
  ctx.fillStyle = skin.trim;
  ctx.fillRect(-8, Math.round(-7 - bob), 16, 12);
  ctx.fillStyle = chestColor;
  ctx.fillRect(-7, Math.round(-6 - bob), 14, 10);

  if (equipped.necklace) {
    ctx.fillStyle = RARITY_STYLES[equipped.necklace.rarity].hex;
    ctx.fillRect(-2, Math.round(-5 - bob), 4, 3);
  }

  const helmColor = equipped.helmet
    ? RARITY_STYLES[equipped.helmet.rarity].hex
    : skin.body;
  ctx.fillStyle = skin.trim;
  ctx.fillRect(-7, Math.round(-17 - bob), 14, 10);
  ctx.fillStyle = helmColor;
  ctx.fillRect(-6, Math.round(-16 - bob), 12, 8);

  ctx.fillStyle = skin.visor;
  const visorX = flip > 0 ? -1 : -5;
  ctx.fillRect(visorX, Math.round(-14 - bob), 6, 3);

  if (options?.guarding) {
    ctx.strokeStyle = "#6fe3c1";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -3, 18, Math.atan2(facingY, facingX) - 0.85, Math.atan2(facingY, facingX) + 0.85);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(0, Math.round(-2 - bob));
  ctx.rotate(Math.atan2(facingY, facingX));
  drawPixelWeapon(
    ctx,
    equipped.weapon?.weaponType,
    equipped.weapon?.rarity,
    Boolean(options?.attacking),
  );
  ctx.restore();

  ctx.restore();
}
export function draw25DBossSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  bossSpec: BossSpec,
  nowMs: number,
  options?: {
    flash?: boolean;
    scaleOverride?: number;
  },
) {
  const flash = Boolean(options?.flash);
  const tier = bossSpec.threatTier;
  const scale = options?.scaleOverride ?? Math.min(2.15, 1.45 + tier * 0.065);
  const bob = Math.abs(Math.sin(nowMs * 0.007)) * 3;
  const flip = facingX < 0 ? -1 : 1;

  const armorDark = flash ? "#ffffff" : bossSpec.secondaryColor;
  const armorMain = flash ? "#ffffff" : bossSpec.primaryColor;
  const glow = flash ? "#ffffff" : bossSpec.glowColor;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0, Math.round(14 * scale), Math.round(15 * scale), Math.round(6 * scale), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(scale, scale);

  if (tier >= 4) {
    const pulse = Math.sin(nowMs * 0.008) * 2;
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -4 - bob, 16 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (tier >= 6) {
    const wingFlutter = Math.sin(nowMs * 0.01) * 2;
    ctx.fillStyle = armorDark;
    ctx.fillRect(-16, Math.round(-14 - bob + wingFlutter), 5, 12);
    ctx.fillRect(11, Math.round(-14 - bob - wingFlutter), 5, 12);
    ctx.fillStyle = glow;
    ctx.fillRect(-15, Math.round(-13 - bob + wingFlutter), 2, 10);
    ctx.fillRect(13, Math.round(-13 - bob - wingFlutter), 2, 10);
  }

  const stride = Math.sin(nowMs * 0.009) * 2;
  ctx.fillStyle = armorDark;
  ctx.fillRect(-6, Math.round(4 - stride * 0.4), 5, 9);
  ctx.fillRect(1, Math.round(4 + stride * 0.4), 5, 9);

  ctx.fillStyle = armorDark;
  ctx.fillRect(-10, Math.round(-9 - bob), 20, 14);
  ctx.fillStyle = armorMain;
  ctx.fillRect(-9, Math.round(-8 - bob), 18, 12);

  ctx.fillStyle = armorDark;
  ctx.fillRect(-3, Math.round(-5 - bob), 6, 6);
  ctx.fillStyle = glow;
  ctx.fillRect(-2, Math.round(-4 - bob), 4, 4);

  const spikeH = tier >= 7 ? 7 : tier >= 3 ? 5 : 3;
  ctx.fillStyle = armorMain;
  ctx.fillRect(-12, Math.round(-10 - bob), 5, 6);
  ctx.fillRect(7, Math.round(-10 - bob), 5, 6);
  ctx.fillStyle = glow;
  ctx.fillRect(-11, Math.round(-10 - spikeH - bob), 2, spikeH);
  ctx.fillRect(9, Math.round(-10 - spikeH - bob), 2, spikeH);

  ctx.fillStyle = armorDark;
  ctx.fillRect(-8, Math.round(-20 - bob), 16, 11);
  ctx.fillStyle = armorMain;
  ctx.fillRect(-7, Math.round(-19 - bob), 14, 9);

  ctx.fillStyle = glow;
  ctx.fillRect(-8, Math.round(-24 - bob), 3, 5);
  ctx.fillRect(5, Math.round(-24 - bob), 3, 5);
  if (tier >= 5) {
    ctx.fillRect(-2, Math.round(-26 - bob), 4, 7);
  }
  if (tier >= 9) {
    ctx.fillRect(-10, Math.round(-27 - bob), 2, 4);
    ctx.fillRect(8, Math.round(-27 - bob), 2, 4);
  }

  ctx.fillStyle = "#080b0d";
  ctx.fillRect(flip < 0 ? -6 : -1, Math.round(-16 - bob), 7, 3);
  ctx.fillStyle = glow;
  ctx.fillRect(flip < 0 ? -5 : 0, Math.round(-15 - bob), 5, 2);

  ctx.save();
  ctx.translate(0, Math.round(-2 - bob));
  ctx.rotate(Math.atan2(facingY, facingX));
  drawPixelWeapon(ctx, "Executioner", tier >= 8 ? "Legendary" : "Epic", false);
  ctx.restore();

  ctx.restore();
}

export function BossMiniPreviewCanvas({ bossSpec }: { bossSpec: BossSpec }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const render = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#070c0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 16) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        draw25DBossSprite(ctx, canvas.width / 2, canvas.height * 0.68, -1, 0, bossSpec, now, {
          scaleOverride: 2.0,
        });
      }
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [bossSpec]);

  return (
    <canvas
      ref={canvasRef}
      width={112}
      height={112}
      className="rounded-lg border border-[#2d4a40] bg-[#070c0a] shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
function draw25DEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy, nowMs: number) {
  if (enemy.health <= 0) return;

  const isBoss = enemy.kind === "boss";
  const isBulwark = enemy.kind === "bulwark";
  const isDuelist = enemy.kind === "duelist";
  const isArcanist = enemy.kind === "arcanist";

  const flash = enemy.hitFlashMs > 0;
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);
  const bob = Math.abs(Math.sin(nowMs * 0.008 + enemy.id)) * (isBoss ? 2.5 : 1.8);

  if (enemy.specialWindupMs > 0) {
    const pct = 1 - enemy.specialWindupMs / Math.max(1, enemy.maxSpecialWindupMs);
    ctx.save();
    if (
      enemy.specialType === "slam" ||
      enemy.specialType === "cryo-nova" ||
      enemy.specialType === "cross-beam" ||
      enemy.specialType === "starburst"
    ) {
      const ringCol =
        enemy.specialType === "cryo-nova"
          ? `rgba(99, 210, 255, ${0.35 + pct * 0.55})`
          : enemy.specialType === "starburst"
            ? `rgba(255, 207, 86, ${0.4 + pct * 0.55})`
            : `rgba(255, 89, 56, ${0.35 + pct * 0.55})`;
      ctx.strokeStyle = ringCol;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y + 6, 128 * pct, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = enemy.specialType === "dash" ? "rgba(209, 140, 232, 0.78)" : "rgba(99, 210, 255, 0.78)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(enemy.aimTargetX, enemy.aimTargetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(enemy.aimTargetX, enemy.aimTargetY, 10 + (1 - pct) * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (enemy.windupMs > 0) {
    const pct = 1 - enemy.windupMs / Math.max(1, enemy.maxWindupMs);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 207, 86, ${0.45 + pct * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const ang = Math.atan2(enemy.facingY, enemy.facingX);
    ctx.arc(x, y, (isBoss ? 58 : 42) * (0.6 + pct * 0.4), ang - 0.75, ang + 0.75);
    ctx.stroke();
    ctx.restore();
  }

  if (isBoss) {
    const spec = enemy.bossSpec ?? getBossSpecForFloor(10);
    draw25DBossSprite(ctx, x, y, enemy.facingX, enemy.facingY, spec, nowMs, { flash });
    if (enemy.stunMs > 0) {
      ctx.fillStyle = "#79f2cc";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("STUNNED", x, y - 42);
    }
    return;
  }

  const scale = isBulwark ? 1.18 : 1.0;

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.beginPath();
  ctx.ellipse(0, Math.round(13 * scale), Math.round(13 * scale), Math.round(5.5 * scale), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(scale, scale);

  const armorDark = flash
    ? "#ffffff"
    : isBulwark
      ? "#213140"
      : isDuelist
        ? "#2e1a3d"
        : isArcanist
          ? "#132e42"
          : "#361c18";
  const armorMain = flash
    ? "#ffffff"
    : isBulwark
      ? "#5d7e9c"
      : isDuelist
        ? "#a968d9"
        : isArcanist
          ? "#3eb5e8"
          : "#cf684c";
  const visorGlow = flash
    ? "#ffffff"
    : isBulwark
      ? "#8ae8ff"
      : isDuelist
        ? "#f5b8ff"
        : isArcanist
          ? "#9ef0ff"
          : "#ffb36b";

  const stride = Math.sin(nowMs * 0.012 + enemy.id) * 2.5;
  const flip = enemy.facingX < 0 ? -1 : 1;

  ctx.fillStyle = armorDark;
  ctx.fillRect(-5, Math.round(4 - stride * 0.5), 4, 8);
  ctx.fillRect(1, Math.round(4 + stride * 0.5), 4, 8);

  ctx.fillStyle = armorDark;
  ctx.fillRect(-9, Math.round(-8 - bob), 18, 13);
  ctx.fillStyle = armorMain;
  ctx.fillRect(-8, Math.round(-7 - bob), 16, 11);

  ctx.fillStyle = visorGlow;
  ctx.fillRect(-10, Math.round(-8 - bob), 4, 4);
  ctx.fillRect(6, Math.round(-8 - bob), 4, 4);

  if (isArcanist) {
    const pulse = Math.sin(nowMs * 0.01) * 2;
    ctx.fillStyle = visorGlow;
    ctx.fillRect(-11, Math.round(-16 - bob + pulse), 2, 2);
    ctx.fillRect(9, Math.round(-16 - bob - pulse), 2, 2);
  }

  ctx.fillStyle = armorDark;
  ctx.fillRect(-7, Math.round(-18 - bob), 14, 10);
  ctx.fillStyle = armorMain;
  ctx.fillRect(-6, Math.round(-17 - bob), 12, 8);

  ctx.fillStyle = "#0b0f12";
  ctx.fillRect(flip < 0 ? -5 : -1, Math.round(-15 - bob), 6, 3);
  ctx.fillStyle = visorGlow;
  ctx.fillRect(flip < 0 ? -4 : 0, Math.round(-14 - bob), 4, 2);

  if (isBulwark && enemy.stunMs <= 0) {
    const shieldX = flip < 0 ? -13 : 9;
    ctx.fillStyle = "rgba(99, 210, 255, 0.35)";
    ctx.fillRect(shieldX, Math.round(-12 - bob), 4, 19);
    ctx.strokeStyle = "#8ae8ff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(shieldX, Math.round(-12 - bob), 4, 19);
  }

  ctx.save();
  ctx.translate(0, Math.round(-2 - bob));
  ctx.rotate(Math.atan2(enemy.facingY, enemy.facingX));
  drawPixelWeapon(
    ctx,
    enemy.weapon,
    isArcanist ? "Epic" : isBulwark ? "Rare" : "Uncommon",
    enemy.windupMs > 0 && enemy.windupMs < 130,
  );
  ctx.restore();

  ctx.restore();

  const barW = 26;
  const barY = y - Math.round(25 * scale) - Math.round(bob);
  ctx.fillStyle = "rgba(8, 13, 12, 0.85)";
  ctx.fillRect(x - barW / 2 - 1, barY - 1, barW + 2, 5);
  const hpPct = Math.max(0, enemy.health / Math.max(1, enemy.maxHealth));
  ctx.fillStyle = "#ff6b5e";
  ctx.fillRect(x - barW / 2, barY, Math.round(barW * hpPct), 3);

  if (enemy.stunMs > 0) {
    ctx.fillStyle = "#79f2cc";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("STUNNED", x, barY - 4);
  }
}

function draw25DBlocker(ctx: CanvasRenderingContext2D, blocker: RoomBlocker, biomeTrim: string, biomeAccent: string) {
  const extrudeH = 18;
  const bx = Math.round(blocker.x);
  const by = Math.round(blocker.y);
  const bw = Math.round(blocker.width);
  const bh = Math.round(blocker.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
  ctx.fillRect(bx + 6, by + 6, bw, bh);

  const topY = by - extrudeH;
  ctx.fillStyle = biomeTrim;
  ctx.fillRect(bx, topY, bw, bh);

  ctx.fillStyle = "#192623";
  ctx.fillRect(bx, topY + bh, bw, extrudeH);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, topY + 0.5, bw - 1, bh + extrudeH - 1);

  ctx.fillStyle = biomeAccent;
  if (blocker.shape === "octagon-reactor") {
    ctx.beginPath();
    ctx.arc(bx + bw / 2, topY + bh / 2, Math.min(bw, bh) * 0.24, 0, Math.PI * 2);
    ctx.fill();
  } else if (blocker.shape === "relay-console") {
    ctx.fillRect(bx + 8, topY + 8, bw - 16, 4);
    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(bx + 8, topY + 16, 10, 4);
  } else if (blocker.shape === "diamond-monolith") {
    ctx.fillRect(bx + bw / 2 - 4, topY + 6, 8, bh - 12);
  } else {
    ctx.fillRect(bx + 6, topY + bh / 2 - 2, bw - 12, 4);
  }
}
function render25DScene(
  ctx: CanvasRenderingContext2D,
  state: DeepSignalRun,
  nowMs: number,
  cutsceneProgress: number,
) {
  const biome = state.currentRoom.biome;
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  if (state.shakeMs > 0) {
    const mag = Math.min(7, state.shakeMs * 0.03);
    ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
  }

  // 1. Deep Subterranean Parallax Ceiling
  const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  skyGrad.addColorStop(0, biome.voidTopColor);
  skyGrad.addColorStop(1, biome.voidBottomColor);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const parallaxShift = state.status === "title" ? (nowMs * 0.035) % 80 : (state.player.x * 0.08) % 80;
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let px = -80; px < WORLD_WIDTH + 80; px += 80) {
    ctx.fillRect(Math.round(px - parallaxShift), 0, 18, 56);
    ctx.fillStyle = biome.accentColor;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(Math.round(px - parallaxShift + 7), 12, 4, 24);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  }

  // 2. 2.5D Back Wall & Side-Angled Corridor Floor Deck
  const wallTop = 18;
  const floorTop = 44;
  const floorBottom = WORLD_HEIGHT - 14;

  ctx.fillStyle = biome.wallColor;
  ctx.fillRect(14, wallTop, WORLD_WIDTH - 28, floorTop - wallTop);
  ctx.fillStyle = biome.trimColor;
  ctx.fillRect(14, wallTop, WORLD_WIDTH - 28, 4);

  ctx.fillStyle = biome.floorColor;
  ctx.fillRect(14, floorTop, WORLD_WIDTH - 28, floorBottom - floorTop);

  ctx.strokeStyle = biome.gridColor;
  ctx.lineWidth = 1;
  for (let gy = floorTop + 34; gy < floorBottom; gy += 34) {
    ctx.beginPath();
    ctx.moveTo(14, gy);
    ctx.lineTo(WORLD_WIDTH - 14, gy);
    ctx.stroke();
  }
  for (let gx = 48; gx < WORLD_WIDTH - 24; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, floorTop);
    ctx.lineTo(gx - 12, floorBottom);
    ctx.stroke();
  }

  ctx.fillStyle = "#0b1210";
  ctx.fillRect(14, floorBottom, WORLD_WIDTH - 28, 12);
  ctx.fillStyle = biome.trimColor;
  ctx.fillRect(14, floorBottom, WORLD_WIDTH - 28, 2);

  // 3. Title Screen or Cave Descent Cutscene Preview
  if (state.status === "title") {
    const walkX = 120 + ((nowMs * 0.05) % (WORLD_WIDTH - 240));
    drawPixelSurveyorSprite(
      ctx,
      walkX,
      WORLD_HEIGHT * 0.58,
      1,
      0,
      state.profile.activeSkin,
      state.equippedGear,
      { walkPhase: nowMs * 0.01 },
    );
    ctx.restore();
    return;
  }

  if (state.status === "entering-cave") {
    const shaftX = WORLD_WIDTH - 135;
    ctx.fillStyle = "#050908";
    ctx.fillRect(shaftX, 26, 86, WORLD_HEIGHT - 52);
    ctx.strokeStyle = biome.accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(shaftX, 26, 86, WORLD_HEIGHT - 52);

    const walkX = 80 + cutsceneProgress * (shaftX - 55);
    drawPixelSurveyorSprite(
      ctx,
      walkX,
      WORLD_HEIGHT / 2 + 12,
      1,
      0,
      state.profile.activeSkin,
      state.equippedGear,
      { walkPhase: nowMs * 0.015 },
    );
    ctx.restore();
    return;
  }

  // 4. Right-Side 2.5D Extraction Elevator Shaft
  const liftX = WORLD_WIDTH - 78;
  const liftY = WORLD_HEIGHT / 2 - 44;
  ctx.fillStyle = state.roomCleared ? "rgba(111, 227, 193, 0.22)" : "rgba(255, 84, 66, 0.12)";
  ctx.fillRect(liftX, liftY, 54, 88);
  ctx.strokeStyle = state.roomCleared ? "#6fe3c1" : "#ff6b5e";
  ctx.lineWidth = 2;
  ctx.strokeRect(liftX, liftY, 54, 88);

  ctx.fillStyle = state.roomCleared ? "#79f2cc" : "#ff8a75";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.roomCleared ? "EXTRACT" : "LOCKED", liftX + 27, liftY - 6);

  // 5. Rare Chest
  if (state.currentRoom.rareChest) {
    const ch = state.currentRoom.rareChest;
    const col = RARITY_STYLES[ch.rarity].hex;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(ch.x - 13, ch.y + 6, 26, 7);
    ctx.fillStyle = ch.opened ? "#3b4743" : col;
    ctx.fillRect(ch.x - 12, ch.y - 10, 24, 18);
    ctx.fillStyle = "#111917";
    ctx.fillRect(ch.x - 12, ch.y - 3, 24, 3);
    if (!ch.opened) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ch.x - 2, ch.y - 5, 4, 6);
    }
  }

  // 6. Breakable Props
  for (const prop of state.currentRoom.props) {
    if (prop.broken) continue;
    const px = Math.round(prop.x);
    const py = Math.round(prop.y);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(px, py + 11, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (prop.kind === "crystal") {
      ctx.fillStyle = "#3ba8e0";
      ctx.fillRect(px - 6, py - 14, 12, 22);
      ctx.fillStyle = "#9ef0ff";
      ctx.fillRect(px - 3, py - 18, 6, 20);
    } else if (prop.kind === "canister") {
      ctx.fillStyle = "#2d5249";
      ctx.fillRect(px - 8, py - 13, 16, 22);
      ctx.fillStyle = "#6fe3c1";
      ctx.fillRect(px - 6, py - 6, 12, 5);
    } else {
      ctx.fillStyle = "#6e4e2e";
      ctx.fillRect(px - 10, py - 12, 20, 20);
      ctx.fillStyle = "#b58954";
      ctx.fillRect(px - 10, py - 16, 20, 6);
    }
  }

  // 7. Physical Bouncing Gold Coins, Diamonds, Gear & Signal Tapes
  const hoverBob = Math.sin(nowMs * 0.008) * 2;
  for (const pk of state.pickups) {
    const px = Math.round(pk.x);
    const py = Math.round(pk.y - pk.z + hoverBob);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(px, Math.round(pk.y + 10), 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (pk.goldAmount) {
      ctx.fillStyle = "#d99b1e";
      ctx.fillRect(px - 5, py - 4, 10, 8);
      ctx.fillStyle = "#ffdf5e";
      ctx.fillRect(px - 4, py - 5, 8, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 2, py - 3, 2, 2);
    } else if (pk.diamondAmount) {
      ctx.fillStyle = "#5ec8ff";
      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px + 6, py);
      ctx.lineTo(px, py + 8);
      ctx.lineTo(px - 6, py);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(px - 1, py - 4, 2, 3);
    } else if (pk.tapeId) {
      ctx.fillStyle = "#ffcf56";
      ctx.fillRect(px - 7, py - 5, 14, 10);
      ctx.fillStyle = "#1b2421";
      ctx.fillRect(px - 4, py - 2, 3, 3);
      ctx.fillRect(px + 1, py - 2, 3, 3);
    } else if (pk.item) {
      const col = RARITY_STYLES[pk.item.rarity].hex;
      ctx.fillStyle = col;
      ctx.fillRect(px - 7, py - 7, 14, 14);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 6.5, py - 6.5, 13, 13);
    }
  }
  type DepthEntity =
  | { kind: "blocker"; ySort: number; blocker: RoomBlocker }
  | { kind: "enemy"; ySort: number; enemy: Enemy }
  | { kind: "player"; ySort: number };

const depthList: DepthEntity[] = [
  ...state.currentRoom.blockers.map((b) => ({ kind: "blocker" as const, ySort: b.y + b.height, blocker: b })),
  ...state.enemies.filter((e) => e.health > 0).map((e) => ({ kind: "enemy" as const, ySort: e.y, enemy: e })),
  { kind: "player" as const, ySort: state.player.y },
];
depthList.sort((a, b) => a.ySort - b.ySort);

for (const entry of depthList) {
  if (entry.kind === "blocker") {
    draw25DBlocker(ctx, entry.blocker, biome.trimColor, biome.accentColor);
  } else if (entry.kind === "enemy") {
    draw25DEnemySprite(ctx, entry.enemy, nowMs);
  } else {
    const moving = Math.hypot(state.player.vx, state.player.vy) > 10;
    drawPixelSurveyorSprite(
      ctx,
      state.player.x,
      state.player.y,
      state.player.facingX,
      state.player.facingY,
      state.profile.activeSkin,
      state.equippedGear,
      {
        walkPhase: moving ? nowMs * 0.015 : 0,
        guarding: state.player.guarding,
        attacking: state.player.attackMs > 0,
        invulnerable: state.player.invulnerableMs > 0,
      },
    );

    if (state.player.attackMs > 0) {
      const ang = Math.atan2(state.player.facingY, state.player.facingX);
      const wRarity = state.equippedGear.weapon?.rarity;
      const arcColor = wRarity ? RARITY_STYLES[wRarity].hex : "#6fe3c1";
      ctx.save();
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y - 3, 34, ang - 0.85, ang + 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }
}

for (const proj of state.projectiles) {
  ctx.fillStyle = proj.color;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

for (const pt of state.particles) {
  const alpha = Math.max(0, Math.min(1, pt.lifeMs / Math.max(1, pt.maxLifeMs)));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pt.color;
  ctx.fillRect(Math.round(pt.x), Math.round(pt.y - pt.z), pt.size, pt.size);
}
ctx.globalAlpha = 1;

ctx.font = "bold 10px monospace";
ctx.textAlign = "center";
for (const pop of state.combatPopups) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillText(pop.text, Math.round(pop.x) + 1, Math.round(pop.y) + 1);
  ctx.fillStyle = pop.color;
  ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
}

ctx.restore();
}

export function BuriedComplexGame({ onBackToArcade }: { onBackToArcade: () => void }) {
const [runState, setRunState] = useState<DeepSignalRun>(() => {
  const profile = loadSurveyorProfile();
  const highestLink = Math.max(1, ...profile.unlockedSignalLinks);
  return createDeepSignalRun(profile, highestLink, "title");
});
const [isMuted, setIsMuted] = useState<boolean>(() => deepSignalAudio.isMuted());
const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
const [confirmWipe, setConfirmWipe] = useState<boolean>(false);
const [showArmory, setShowArmory] = useState<boolean>(false);
const [armoryTab, setArmoryTab] = useState<"vault" | "fusion" | "index" | "skins">("vault");
const [vaultPage, setVaultPage] = useState<number>(0);
const [vaultSellRarity, setVaultSellRarity] = useState<GearRarity | "all">("all");
const [upgradeQty, setUpgradeQty] = useState<number | "MAX">(1);
const [selectedVaultItemId, setSelectedVaultItemId] = useState<string | null>(null);
const [indexSlotFilter, setIndexSlotFilter] = useState<GearSlot | "all">("all");
const [caveCutsceneProgress, setCaveCutsceneProgress] = useState<number>(0);
const [selectedStartFloor, setSelectedStartFloor] = useState<number>(() => {
  const profile = loadSurveyorProfile();
  return Math.max(1, ...profile.unlockedSignalLinks);
});
const [toastMsg, setToastMsg] = useState<string | null>(null);

const containerRef = useRef<HTMLDivElement | null>(null);
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const keysRef = useRef<KeyMap>({});
const mouseLookRef = useRef<{ x: number; y: number; active: boolean }>({ x: 1, y: 0, active: false });
const runStateRef = useRef<DeepSignalRun>(runState);
runStateRef.current = runState;

const showToast = (msg: string) => {
  setToastMsg(msg);
  window.setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 2400);
};

useEffect(() => {
  return () => {
    deepSignalAudio.updateMusicState("off", "outer-bunker");
  };
}, []);

useEffect(() => {
  const biomeId = runState.currentRoom.biome.id;
  if (runState.status === "title" || runState.status === "entering-cave") {
    deepSignalAudio.updateMusicState("menu", biomeId);
  } else if (runState.status === "playing") {
    const hasBoss = runState.enemies.some((e) => e.kind === "boss" && e.health > 0);
    const hasEnemies = runState.enemies.some((e) => e.health > 0);
    deepSignalAudio.updateMusicState(hasBoss ? "boss" : hasEnemies ? "combat" : "explore", biomeId);
  } else {
    deepSignalAudio.updateMusicState("menu", biomeId);
  }
}, [runState.status, runState.currentRoom.biome.id, runState.roomCleared]);

const prevHitSeq = useRef(0);
const prevKillSeq = useRef(0);
const prevPickupSeq = useRef(0);
const prevBossTs = useRef(0);

useEffect(() => {
  if (runState.lastHitSound && runState.lastHitSound.seq !== prevHitSeq.current) {
    prevHitSeq.current = runState.lastHitSound.seq;
    deepSignalAudio.playCombatHit(runState.lastHitSound.kind);
  }
  if (runState.lastKillSound && runState.lastKillSound.seq !== prevKillSeq.current) {
    prevKillSeq.current = runState.lastKillSound.seq;
    deepSignalAudio.playEnemyKill(runState.lastKillSound.isBoss);
  }
  if (runState.lastPickupSound && runState.lastPickupSound.seq !== prevPickupSeq.current) {
    prevPickupSeq.current = runState.lastPickupSound.seq;
    deepSignalAudio.playPickup(runState.lastPickupSound.kind);
  }
  if (runState.lastBossEvent && runState.lastBossEvent.timestamp !== prevBossTs.current) {
    prevBossTs.current = runState.lastBossEvent.timestamp;
    deepSignalAudio.triggerCorruptedBossCheckpoint();
    setSelectedStartFloor(runState.lastBossEvent.unlockedLink);
    showToast(runState.lastBossEvent.subtitle);
  }
}, [runState.lastHitSound, runState.lastKillSound, runState.lastPickupSound, runState.lastBossEvent]);

  useEffect(() => {
    if (runState.status !== "entering-cave") return;
    setCaveCutsceneProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(1, (now - start) / 2000);
      setCaveCutsceneProgress(pct);
      if (pct >= 1) {
        setRunState((prev) => startDeepSignalRun(prev, selectedStartFloor));
      } else {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [runState.status, selectedStartFloor]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === "Tab" || code === "KeyI") {
        e.preventDefault();
        setShowArmory((prev) => !prev);
        return;
      }
      if (code === "Escape") {
        setShowArmory(false);
        return;
      }
      keysRef.current[code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let rafId = 0;

    const frame = (now: number) => {
      const dt = Math.min(50, now - lastTime);
      lastTime = now;

      const keys = keysRef.current;
      const moveX = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
      const moveY = (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0) - (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0);

      const input: PlayerInput = {
        moveX,
        moveY,
        lookX: mouseLookRef.current.active ? mouseLookRef.current.x : moveX,
        lookY: mouseLookRef.current.active ? mouseLookRef.current.y : moveY,
        attack: Boolean(keys["KeyJ"] || keys["MouseLeft"]),
        guard: Boolean(keys["KeyK"] || keys["ShiftLeft"] || keys["ShiftRight"] || keys["MouseRight"]),
        dodge: Boolean(keys["Space"]),
        interact: Boolean(keys["KeyE"]),
      };

      if (!showArmory && runStateRef.current.status === "playing") {
        if (input.attack && !runStateRef.current.attackWasDown && runStateRef.current.player.attackCooldownMs <= 0) {
          deepSignalAudio.playWeaponSwing(runStateRef.current.equippedGear.weapon?.weaponType);
        }
        setRunState((prev) => {
          const next = stepDeepSignalRun(prev, input, dt);
          if (next.status === "defeated" && prev.status !== "defeated") {
            saveSurveyorProfile(next.profile);
          }
          return next;
        });
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        render25DScene(ctx, runStateRef.current, now, caveCutsceneProgress);
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [showArmory, caveCutsceneProgress]);

  const updateProfile = (nextProfile: SurveyorProfile) => {
    saveSurveyorProfile(nextProfile);
    setRunState((prev) => {
      const refreshed = computePlayerMaxStats(
        prev.player.level,
        prev.player.stats,
        nextProfile.equippedGear,
        nextProfile.slotUpgradeLevels,
      );
      return {
        ...prev,
        profile: nextProfile,
        equippedGear: { ...nextProfile.equippedGear },
        player: {
          ...prev.player,
          maxHealth: refreshed.maxHealth,
          health: Math.min(refreshed.maxHealth, prev.player.health),
          maxStamina: refreshed.maxStamina,
          stamina: Math.min(refreshed.maxStamina, prev.player.stamina),
        },
      };
    });
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    mouseLookRef.current = {
      x: cx - runState.player.x,
      y: cy - runState.player.y,
      active: true,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleCanvasMouseMove(e);
    if (e.button === 0) keysRef.current["MouseLeft"] = true;
    if (e.button === 2) keysRef.current["MouseRight"] = true;
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) keysRef.current["MouseLeft"] = false;
    if (e.button === 2) keysRef.current["MouseRight"] = false;
  };

  const computedStats = computePlayerMaxStats(
    runState.player.level,
    runState.player.stats,
    runState.equippedGear,
    runState.profile.slotUpgradeLevels,
  );

  const activeBoss = runState.enemies.find((e) => e.kind === "boss" && e.health > 0) ?? null;

  const selectedVaultItem =
    runState.profile.bankedGear.find((g) => g.id === selectedVaultItemId) ??
    runState.profile.bankedGear.at(0) ??
    null;

  const pageItems = runState.profile.bankedGear.slice(
    vaultPage * VAULT_PAGE_SIZE,
    (vaultPage + 1) * VAULT_PAGE_SIZE,
  );

  const filteredCatalog =
    indexSlotFilter === "all"
      ? FULL_ITEM_CATALOG
      : FULL_ITEM_CATALOG.filter((bp) => bp.slot === indexSlotFilter);

  const floorNum = runState.roomIndex + 1;
  const hpPct = Math.max(0, Math.min(100, (runState.player.health / Math.max(1, runState.player.maxHealth)) * 100));
  const staPct = Math.max(0, Math.min(100, (runState.player.stamina / Math.max(1, runState.player.maxStamina)) * 100));

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070d0b] text-[#e6f5ee] font-mono flex flex-col items-center justify-center p-3 select-none"
    >
      {/* Top Arcade & Currency Header */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              deepSignalAudio.updateMusicState("off", "outer-bunker");
              onBackToArcade();
            }}
            className="px-2.5 py-1.5 rounded bg-[#121f1b] hover:bg-[#1a2e28] border border-[#2b453c] text-xs font-bold text-[#9be8cf]"
          >
            ← JB PLAYNET
          </button>
          <span className="text-xs font-extrabold tracking-widest text-[#6fe3c1]">
            THE SIGNAL BELOW · v2.6
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-[#1d190c] border border-[#6e5619] text-[#ffcf4d] font-bold">
            GOLD: {runState.profile.gold + runState.carriedGold}
          </span>
          <span className="px-2.5 py-1 rounded bg-[#0c1b26] border border-[#23567a] text-[#5ec8ff] font-bold">
            GEMS: {runState.profile.diamonds + runState.carriedDiamonds}
          </span>
          <button
            type="button"
            onClick={() => setShowArmory((prev) => !prev)}
            className="px-3 py-1 rounded bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-extrabold"
          >
            {showArmory ? "CLOSE ARMORY [I]" : "ARMORY & INDEX [I]"}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(deepSignalAudio.toggleMute())}
            className="px-2.5 py-1 rounded bg-[#121f1b] border border-[#2b453c] text-[#b8d8cc] font-bold"
          >
            {isMuted ? "AUDIO OFF" : "AUDIO ON"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded bg-[#121f1b] border border-[#2b453c] text-[#b8d8cc] font-bold"
          >
            {isFullscreen ? "EXIT FULL" : "FULLSCREEN"}
          </button>
        </div>
      </div>

      {/* Main 2.5D Viewport Frame */}
      <div className="relative w-full max-w-4xl rounded-xl overflow-hidden border-2 border-[#263f36] bg-[#080f0d] shadow-2xl">
        {/* Live Combat HUD Strip */}
        {runState.status !== "title" && runState.status !== "entering-cave" && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#0c1613] border-b border-[#1d302a] text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[#ff786b] font-bold">HP</span>
                <div className="w-24 h-2.5 bg-[#1d1110] rounded overflow-hidden border border-[#4a221e]">
                  <div className="h-full bg-[#ff5442] transition-all" style={{ width: `${hpPct}%` }} />
                </div>
                <span className="text-[11px] font-bold">
                  {Math.ceil(runState.player.health)}/{runState.player.maxHealth}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#6fe3c1] font-bold">STA</span>
                <div className="w-20 h-2.5 bg-[#0e1f1a] rounded overflow-hidden border border-[#1f473c]">
                  <div className="h-full bg-[#6fe3c1] transition-all" style={{ width: `${staPct}%` }} />
                </div>
              </div>

              <span className="text-[#ffcf56] font-bold">ATK {computedStats.totalAttack}</span>
              <span className="text-[#9bc4b4]">LV.{runState.player.level}</span>
            </div>

            <div className="font-extrabold tracking-wider text-[#6fe3c1]">
              {runState.currentRoom.name}
            </div>

            <div className="text-[11px] text-[#9bc4b4]">
              RUN HAUL: <span className="text-[#ffcf4d] font-bold">{runState.carriedGold}G</span> ·{" "}
              <span className="text-[#5ec8ff] font-bold">{runState.carriedDiamonds} GEM</span> ·{" "}
              <span className="text-[#e6f5ee] font-bold">
                {runState.carriedGear.reduce((a, b) => a + b.count, 0)} GEAR
              </span>
            </div>
          </div>
        )}

        {/* Dedicated Top Boss Health Bar */}
        {activeBoss && runState.status === "playing" && (
          <div className="px-4 py-2 bg-gradient-to-r from-[#1a0c0a] via-[#24100d] to-[#1a0c0a] border-b border-[#5e241d]">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-[#ff5442] text-[#090d0c] font-black text-[10px]">
                  GUARDIAN F{String(floorNum).padStart(2, "0")}
                </span>
                <span className="font-black tracking-wider text-[#ffdf6b]">
                  {activeBoss.bossSpec?.name ?? "SECTOR GUARDIAN"}
                </span>
                <span className="text-[10px] text-[#d4a59a] hidden sm:inline">
                  — {activeBoss.bossSpec?.title} ({activeBoss.bossSpec?.abilityLabel})
                </span>
              </div>
              <span className="font-extrabold text-[#ff9e94]">
                {Math.ceil(activeBoss.health)} / {activeBoss.maxHealth} HP
              </span>
            </div>
            <div className="w-full h-3 bg-[#120706] rounded-full overflow-hidden border border-[#6e2820]">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${Math.max(0, Math.min(100, (activeBoss.health / Math.max(1, activeBoss.maxHealth)) * 100))}%`,
                  backgroundColor: activeBoss.bossSpec?.primaryColor ?? "#ff5442",
                }}
              />
            </div>
          </div>
        )}

        {/* Toast Banner */}
        {toastMsg && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-[#0d1c17] border border-[#6fe3c1] text-[#8ef7d8] text-xs font-extrabold shadow-lg">
            {toastMsg}
          </div>
        )}

        {/* 2.5D Canvas */}
        <canvas
          ref={canvasRef}
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-auto block cursor-crosshair"
        />

        {/* TITLE SCREEN OVERLAY */}
        {runState.status === "title" && !showArmory && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#060c0a]/95 via-[#060c0a]/45 to-[#060c0a]/80 flex flex-col justify-between p-6">
            <div className="flex items-start justify-between">
              <div className="px-3 py-1.5 rounded bg-[#0c1714]/90 border border-[#29453b] text-xs">
                <div className="text-[#6fe3c1] font-extrabold">
                  SURVEYOR LV.{runState.profile.level} · DEEPEST F{String(runState.profile.deepestFloor).padStart(2, "0")}
                </div>
                <div className="text-[#8fb5a6] text-[11px]">
                  INDEX DISCOVERED: {runState.profile.discoveredItems.length} / {FULL_ITEM_CATALOG.length} ITEMS
                </div>
              </div>

              <div>
                {!confirmWipe ? (
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(true)}
                    className="px-2.5 py-1 rounded bg-[#2b1010] hover:bg-[#3d1515] border border-[#8f2929] text-[#ff8a80] text-[11px] font-bold"
                  >
                    WIPE SAVE
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#240c0c] border border-[#ff5442] px-2.5 py-1 rounded text-[11px]">
                    <span className="text-[#ff9e94] font-bold">CONFIRM WIPE?</span>
                    <button
                      type="button"
                      onClick={() => {
                        const fresh = resetSurveyorProfile();
                        setRunState(createDeepSignalRun(fresh, 1, "title"));
                        setSelectedStartFloor(1);
                        setConfirmWipe(false);
                        showToast("SAVE PROFILE RESET");
                      }}
                      className="px-2 py-0.5 rounded bg-[#ff5442] text-[#080f0d] font-extrabold"
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmWipe(false)}
                      className="px-2 py-0.5 rounded bg-[#182621] text-[#d8eee4] font-bold"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center my-auto">
              <div className="text-xs tracking-[0.3em] text-[#6fe3c1] font-bold mb-1">
                JB PLAYNET FLAGSHIP EXTRACTION ARPG
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-[#f2fff9] drop-shadow-[0_3px_0_#133027]">
                THE SIGNAL BELOW
              </h1>
              <p className="text-xs text-[#9ec4b5] mt-2 max-w-md mx-auto">
                Push through 100 subterranean floors. Slay unique sector guardians for Gold &amp; Gems, fuse duplicates (3 → 9 → 27), and extract alive.
              </p>

              {/* Unlocked Signal Link Selector */}
              {runState.profile.unlockedSignalLinks.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#8fb5a6] font-bold">DEPLOY FLOOR:</span>
                  {runState.profile.unlockedSignalLinks.map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setSelectedStartFloor(fl)}
                      className={`px-2 py-0.5 rounded text-xs font-extrabold border ${
                        selectedStartFloor === fl
                          ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                          : "bg-[#101c18] text-[#9bc4b4] border-[#284239]"
                      }`}
                    >
                      F{String(fl).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    deepSignalAudio.playUiChime("extract");
                    setRunState((prev) => ({ ...prev, status: "entering-cave" }));
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-black text-sm tracking-wider shadow-lg"
                >
                  ▶ START DESCENT (F{String(selectedStartFloor).padStart(2, "0")})
                </button>
                <button
                  type="button"
                  onClick={() => setShowArmory(true)}
                  className="px-4 py-2.5 rounded-lg bg-[#13221d] hover:bg-[#1b3029] border border-[#34574b] text-[#d8eee4] font-extrabold text-sm"
                >
                  ARMORY, FUSION &amp; INDEX
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] text-[#7ca394]">
              MOVE: WASD / ARROWS · SLASH: CLICK / J · GUARD (65% BLOCK / PARRY): RIGHT-CLICK / SHIFT · DASH: SPACE · ARMORY: [I]
            </div>
          </div>
        )}

        {/* CAVE DESCENT CUTSCENE OVERLAY */}
        {runState.status === "entering-cave" && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
            <div className="text-xs font-extrabold tracking-widest text-[#6fe3c1]">
              DESCENDING INTO SUB-LEVEL SHAFT · FLOOR {String(selectedStartFloor).padStart(2, "0")}...
            </div>
            <div className="self-end pointer-events-auto">
              <button
                type="button"
                onClick={() => setRunState((prev) => startDeepSignalRun(prev, selectedStartFloor))}
                className="px-3 py-1 rounded bg-[#0d1c17] border border-[#6fe3c1] text-xs font-bold text-[#d8eee4]"
              >
                SKIP →
              </button>
            </div>
          </div>
        )}

        {/* POST-BOSS DEFEAT LORE DOSSIER (WITH ANIMATED MINI-BOSS) */}
        {runState.status === "boss-lore" && runState.pendingBossLore && !showArmory && (
          <div className="absolute inset-0 bg-[#060b0a]/95 flex flex-col items-center justify-center p-5 gap-4 text-center z-20">
            <div className="text-xs font-black tracking-[0.25em] text-[#ffcf56]">
              GUARDIAN NEUTRALIZED · SIGNAL TRANSMISSION DECODED
            </div>

            <div className="max-w-xl w-full p-4 rounded-xl bg-[#0c1613] border-2 border-[#3a5c50] flex flex-col sm:flex-row items-center gap-4 text-left shadow-2xl">
            <BossMiniPreviewCanvas bossSpec={runState.pendingBossLore.bossSpec} />
              <div className="space-y-1.5">
                <div className="text-base font-black text-[#ffdf6b]">
                  {runState.pendingBossLore.bossName}
                </div>
                <div className="text-[11px] font-bold text-[#6fe3c1]">
                  {runState.pendingBossLore.bossTitle} · SIGNATURE: {runState.pendingBossLore.abilityLabel}
                </div>
                {runState.pendingBossLore.loreTape ? (
                  <>
                    <div className="text-xs font-extrabold text-[#e6f5ee] pt-1">
                      {runState.pendingBossLore.loreTape.title}
                    </div>
                    <p className="text-xs text-[#a5ccc0] leading-relaxed">
                      “{runState.pendingBossLore.loreTape.transcript}”
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[#a5ccc0] leading-relaxed">
                    Regional carrier wave stabilized. Signal Link F{runState.pendingBossLore.unlockedLink} permanently locked for future deployments.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                deepSignalAudio.playUiChime("extract");
                setRunState((prev) => acknowledgeBossLore(prev));
              }}
              className="px-6 py-2.5 rounded-lg bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-black text-xs tracking-wider"
            >
              CONTINUE TO EXTRACTION LIFT →
            </button>
          </div>
        )}

        {/* DIAMOND MERCHANT SHOP OVERLAY */}
        {runState.status === "shop" && !showArmory && (
          <div className="absolute inset-0 bg-[#060c10]/92 flex flex-col items-center justify-center p-5 gap-4">
            <div className="text-lg font-black tracking-wider text-[#5ec8ff]">
              ◆ SUBTERRANEAN DIAMOND MERCHANT ◆
            </div>
            <div className="text-xs text-[#a5cde0]">
              Available Diamonds:{" "}
              <span className="font-extrabold text-[#5ec8ff]">
                {runState.profile.diamonds + runState.carriedDiamonds}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {runState.shopOffers.map((offer) => {
                const canBuy =
                  !offer.purchased && runState.profile.diamonds + runState.carriedDiamonds >= offer.diamondCost;
                return (
                  <div
                    key={offer.id}
                    className="p-3 rounded-lg bg-[#0d1c26] border border-[#2a4f66] flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-[#e6f6ff]">{offer.label}</div>
                      <div className="text-[11px] text-[#8fb3c7] mt-1">{offer.description}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!canBuy}
                      onClick={() => {
                        deepSignalAudio.playUiChime("shop");
                        setRunState((prev) => buyDiamondShopOffer(prev, offer.id));
                      }}
                      className={`w-full py-1.5 rounded text-xs font-extrabold ${
                        offer.purchased
                          ? "bg-[#1d2d36] text-[#6d8a99]"
                          : canBuy
                            ? "bg-[#5ec8ff] hover:bg-[#82d6ff] text-[#05131c]"
                            : "bg-[#14222b] text-[#4c6775]"
                      }`}
                    >
                      {offer.purchased ? "PURCHASED" : `BUY (${offer.diamondCost} GEMS)`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  deepSignalAudio.playUiChime("extract");
                  const next = extractWithLoot(runState);
                  saveSurveyorProfile(next.profile);
                  setRunState(next);
                }}
                className="px-4 py-2 rounded-lg bg-[#2b220d] border border-[#ffcf56] text-[#ffe394] text-xs font-extrabold"
              >
                EXTRACT &amp; BANK ALL
              </button>
              <button
                type="button"
                onClick={() => setRunState((prev) => descendToNextFloor(prev))}
                className="px-5 py-2 rounded-lg bg-[#6fe3c1] text-[#06120e] text-xs font-black"
              >
                DESCEND TO FLOOR {floorNum + 1} →
              </button>
            </div>
          </div>
        )}

        {/* FLOOR CLEAR / EXTRACT OR DESCEND OVERLAY */}
        {runState.status === "floor-clear" && !showArmory && (
          <div className="absolute inset-0 bg-[#060c0a]/88 flex flex-col items-center justify-center p-5 gap-3 text-center">
            <div className="text-xl font-black text-[#6fe3c1]">
              FLOOR {String(floorNum).padStart(2, "0")} CLEARED!
            </div>
            <div className="text-xs text-[#b8d8cc]">
              Unbanked Haul: <span className="text-[#ffcf4d] font-bold">{runState.carriedGold} Gold</span> ·{" "}
              <span className="text-[#5ec8ff] font-bold">{runState.carriedDiamonds} Gems</span> ·{" "}
              <span className="font-bold">{runState.carriedGear.reduce((a, b) => a + b.count, 0)} Gear</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  deepSignalAudio.playUiChime("extract");
                  const next = extractWithLoot(runState);
                  saveSurveyorProfile(next.profile);
                  setRunState(next);
                  setShowArmory(true);
                }}
                className="px-4 py-2 rounded-lg bg-[#2b220d] hover:bg-[#3b2f12] border border-[#ffcf56] text-[#ffe394] text-xs font-extrabold"
              >
                EXTRACT &amp; OPEN ARMORY
              </button>
              <button
                type="button"
                onClick={() => setRunState((prev) => descendToNextFloor(prev))}
                className="px-5 py-2 rounded-lg bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-xs font-black"
              >
                DESCEND TO FLOOR {floorNum + 1} →
              </button>
            </div>
          </div>
        )}

        {/* VICTORY / ESCAPED / DEFEATED OVERLAY */}
        {(runState.status === "escaped" || runState.status === "defeated" || runState.status === "victory-ending") &&
          !showArmory && (
            <div className="absolute inset-0 bg-[#060a09]/92 flex flex-col items-center justify-center p-6 gap-3 text-center">
              <div
                className={`text-2xl font-black ${
                  runState.status === "defeated" ? "text-[#ff6b5e]" : "text-[#6fe3c1]"
                }`}
              >
                {runState.status === "defeated"
                  ? "SIGNAL LOST · RUN TERMINATED"
                  : runState.status === "victory-ending"
                    ? "FLOOR 100 SOVEREIGN SHATTERED!"
                    : "EXTRACTION COMPLETE · HAUL BANKED"}
              </div>
              <div className="text-xs text-[#b8d8cc] max-w-md">{runState.message}</div>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowArmory(true)}
                  className="px-4 py-2 rounded-lg bg-[#13221d] border border-[#6fe3c1] text-[#d8eee4] text-xs font-extrabold"
                >
                  OPEN ARMORY &amp; FUSION
                </button>
                {runState.status === "victory-ending" && (
                  <button
                    type="button"
                    onClick={() => setRunState((prev) => continueOverdriveAfterEnding(prev))}
                    className="px-4 py-2 rounded-lg bg-[#ffcf56] text-[#1a1304] text-xs font-black"
                  >
                    ENTER OVERDRIVE (F101+)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const highestLink = Math.max(1, ...runState.profile.unlockedSignalLinks);
                    const deployFl = runState.profile.unlockedSignalLinks.includes(selectedStartFloor)
                      ? selectedStartFloor
                      : highestLink;
                    setSelectedStartFloor(deployFl);
                    setRunState((prev) => startDeepSignalRun(prev, deployFl));
                  }}
                  className="px-5 py-2 rounded-lg bg-[#6fe3c1] text-[#06120e] text-xs font-black"
                >
                  DEPLOY AGAIN (F{String(Math.max(selectedStartFloor, Math.max(1, ...runState.profile.unlockedSignalLinks))).padStart(2, "0")})
                </button>
              </div>
            </div>
          )}
        {/* ARMORY: PERSISTENT MULTI-BUY SLOT UPGRADES, UNEQUIP ALL, FILTERED SELL, FUSION, INDEX & BOSS ARCHIVES */}
        {showArmory && (
          <div className="absolute inset-0 bg-[#060b09]/98 flex flex-col p-3 gap-2.5 overflow-y-auto z-30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1d322b] pb-2">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "vault", label: "EQUIP & VAULT (4 PAGES)" },
                    { id: "fusion", label: "FUSION (3 → 9 → 27)" },
                    { id: "index", label: `ITEM INDEX (${runState.profile.discoveredItems.length}/${FULL_ITEM_CATALOG.length})` },
                    { id: "skins", label: "SUITS, BOSSES & TAPES" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setArmoryTab(t.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-extrabold border ${
                      armoryTab === t.id
                        ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                        : "bg-[#0e1a16] text-[#9bc4b4] border-[#253f36] hover:bg-[#152620]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowArmory(false)}
                className="px-3 py-1 rounded bg-[#182923] border border-[#3a5e51] text-[#e6f5ee] text-xs font-extrabold"
              >
                CLOSE [ESC]
              </button>
            </div>

            {runState.profile.unlockedSignalLinks.length > 1 && (
              <div className="px-2.5 py-1.5 rounded bg-[#0c1714] border border-[#223b32] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-extrabold text-[#6fe3c1]">SIGNAL LINK WARP:</span>
                <div className="flex flex-wrap items-center gap-1">
                  {runState.profile.unlockedSignalLinks.map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        setSelectedStartFloor(fl);
                        setRunState((prev) => startDeepSignalRun(prev, fl));
                        setShowArmory(false);
                        showToast(`WARPED TO FLOOR ${String(fl).padStart(2, "0")}`);
                      }}
                      className={`px-2 py-0.5 rounded font-extrabold border ${
                        floorNum === fl
                          ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                          : "bg-[#101f1a] hover:bg-[#193028] text-[#bfe3d5] border-[#2b4a3f]"
                      }`}
                    >
                      F{String(fl).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {armoryTab === "vault" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
                <div className="md:col-span-5 bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-black text-[#6fe3c1]">EQUIPPED LOADOUT</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = equipBestGearFromBank(runState.profile);
                          updateProfile(next);
                          deepSignalAudio.playUiChime("upgrade");
                          showToast("EQUIPPED BEST GEAR");
                        }}
                        className="px-2 py-0.5 rounded bg-[#6fe3c1] text-[#06120e] text-[10px] font-black"
                      >
                        ★ EQUIP BEST
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = unequipAllSlotsToBank(runState.profile);
                          updateProfile(next);
                          deepSignalAudio.playUiChime("shop");
                          showToast("UNEQUIPPED ALL SLOTS");
                        }}
                        className="px-2 py-0.5 rounded bg-[#182923] hover:bg-[#233b32] border border-[#36594d] text-[#bfe3d5] text-[10px] font-extrabold"
                      >
                        UNEQUIP ALL
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 bg-[#080e0c] border border-[#1a2e27] rounded px-2 py-1">
                    <span className="text-[10px] font-bold text-[#ffcf4d]">UPGRADE QTY:</span>
                    <div className="flex items-center gap-1">
                      {([1, 5, 10, 20, "MAX"] as const).map((qty) => (
                        <button
                          key={String(qty)}
                          type="button"
                          onClick={() => setUpgradeQty(qty)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${
                            upgradeQty === qty
                              ? "bg-[#ffcf4d] text-[#171203] border-[#ffcf4d]"
                              : "bg-[#111c18] text-[#9bc4b4] border-[#253f36]"
                          }`}
                        >
                          {qty === "MAX" ? "MAX" : `${qty}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-y-auto">
                    {ALL_GEAR_SLOTS.map((slot) => {
                      const item = runState.profile.equippedGear[slot];
                      const slotLv = runState.profile.slotUpgradeLevels[slot] ?? 1;
                      const plan = getMultiSlotUpgradePlan(runState.profile.gold, slotLv, upgradeQty);
                      const canUpgrade = slotLv < MAX_SLOT_UPGRADE_LEVEL && plan.levelsToBuy > 0;
                      const eff = item ? getEffectiveGearStats(item, slotLv) : null;

                      return (
                        <div
                          key={slot}
                          className={`p-2 rounded border flex items-center justify-between gap-2 ${
                            item
                              ? `${RARITY_STYLES[item.rarity].border} ${RARITY_STYLES[item.rarity].bg}`
                              : "border-[#1d302a] bg-[#080e0c]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item ? (
                              <PixelGearIcon slot={slot} rarity={item.rarity} weaponType={item.weaponType} size={28} />
                            ) : (
                              <div className="w-7 h-7 rounded bg-[#101c18] border border-[#223830] flex items-center justify-center text-[9px] text-[#557066]">
                                —
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] text-[#7ca394] font-bold">
                                {SLOT_LABELS[slot]} · <span className="text-[#ffcf4d]">LV.{slotLv}</span>
                              </div>
                              {item ? (
                                <>
                                  <div className={`text-xs font-extrabold truncate ${RARITY_STYLES[item.rarity].text}`}>
                                    {item.name} {item.ascensionRank > 0 ? `★${item.ascensionRank}` : ""}
                                  </div>
                                  <div className="text-[10px] text-[#b8d8cc]">
                                    {eff && eff.attack > 0 ? `+${eff.attack} ATK ` : ""}
                                    {eff && eff.health > 0 ? `+${eff.health} HP ` : ""}
                                    {eff && eff.guard > 0 ? `+${eff.guard} STA ` : ""}
                                    {eff && eff.agility > 0 ? `+${eff.agility} SPD` : ""}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[11px] text-[#557066]">Empty Slot</div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={!canUpgrade}
                              onClick={() => {
                                const next = upgradeEquippedSlotBulkWithGold(runState.profile, slot, upgradeQty);
                                if (next !== runState.profile) {
                                  updateProfile(next);
                                  deepSignalAudio.playUiChime("upgrade");
                                  showToast(`${SLOT_LABELS[slot]} +${plan.levelsToBuy} LV (-${plan.totalCost}G)`);
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  canUpgrade
                                  ? "bg-[#ffcf4d] hover:bg-[#ffe082] text-[#171203]"
                                  : "bg-[#1a241e] text-[#5c6e64]"
                              }`}
                            >
                              {slotLv >= MAX_SLOT_UPGRADE_LEVEL
                                ? "MAX"
                                : plan.levelsToBuy > 0
                                  ? `+${plan.levelsToBuy} (${plan.totalCost}G)`
                                  : "LOW GOLD"}
                            </button>
                            {item && (
                              <button
                                type="button"
                                onClick={() => updateProfile(unequipSlotToBank(runState.profile, slot))}
                                className="px-1.5 py-0.5 rounded bg-[#15241f] border border-[#2b473d] text-[9px] text-[#9bc4b4]"
                              >
                                UNEQUIP
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: 4-Page Vault + Rarity Sell Filter + Item Inspector */}
                <div className="md:col-span-7 bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-[#6fe3c1]">
                      VAULT STACKS ({runState.profile.bankedGear.length}/{VAULT_PAGE_SIZE * VAULT_TOTAL_PAGES})
                    </span>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: VAULT_TOTAL_PAGES }).map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setVaultPage(pIdx)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                            vaultPage === pIdx
                              ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                              : "bg-[#0e1a16] text-[#8fb5a6] border-[#253f36]"
                          }`}
                        >
                          P{pIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sell Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#080e0c] border border-[#1a2e27] rounded px-2 py-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[9px] font-bold text-[#8fb5a6]">FILTER:</span>
                      {(["all", "Common", "Uncommon", "Rare", "Epic", "Legendary"] as const).map((rar) => (
                        <button
                          key={rar}
                          type="button"
                          onClick={() => setVaultSellRarity(rar)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                            vaultSellRarity === rar
                              ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                              : "bg-[#101c18] text-[#9bc4b4] border-[#253f36]"
                          }`}
                        >
                          {rar === "all" ? "ALL" : rar.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const { profile: nextP, goldEarned, soldCount } = sellFilteredBankItems(
                          runState.profile,
                          vaultSellRarity,
                          "all",
                        );
                        if (soldCount > 0) {
                          updateProfile(nextP);
                          deepSignalAudio.playUiChime("sell");
                          showToast(`SOLD ${soldCount} UN-ASCENDED ITEMS (+${goldEarned}G)`);
                        } else {
                          showToast("NO UN-ASCENDED ITEMS MATCH FILTER");
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-[#361614] hover:bg-[#4a1e1b] border border-[#9c362f] text-[#ff9b94] text-[9px] font-black"
                    >
                      SELL FILTERED ({vaultSellRarity === "all" ? "ALL" : vaultSellRarity.toUpperCase()})
                    </button>
                  </div>

                  {/* 8x8 Paginated Vault Grid */}
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: VAULT_PAGE_SIZE }).map((_, idx) => {
                      const item = pageItems.at(idx);
                      const matchesFilter = !item || vaultSellRarity === "all" || item.rarity === vaultSellRarity;
                      const isSelected = item && selectedVaultItem?.id === item.id;
                      const canFuseStack = item && item.count >= ASCENSION_MERGE_COUNT;

                      return (
                        <button
                          key={item ? item.id : `empty-${vaultPage}-${idx}`}
                          type="button"
                          onClick={() => item && setSelectedVaultItemId(item.id)}
                          onDoubleClick={() => {
                            if (item) {
                              updateProfile(equipFromBankToSlot(runState.profile, item.id));
                              deepSignalAudio.playPickup("gear");
                            }
                          }}
                          className={`aspect-square rounded border relative flex items-center justify-center transition ${
                            item
                              ? `${RARITY_STYLES[item.rarity].border} ${RARITY_STYLES[item.rarity].bg} ${
                                  isSelected ? "ring-2 ring-[#ffffff]" : ""
                                } ${matchesFilter ? "" : "opacity-30"}`
                              : "border-[#162621] bg-[#070d0b]"
                          }`}
                        >
                          {item && (
                            <>
                              <PixelGearIcon
                                slot={item.slot}
                                rarity={item.rarity}
                                weaponType={item.weaponType}
                                size={24}
                              />
                              {item.ascensionRank > 0 && (
                                <span className="absolute top-0.5 left-0.5 px-1 rounded bg-[#1f1329] text-[#eabfff] text-[8px] font-black leading-tight">
                                  ★{item.ascensionRank}
                                </span>
                              )}
                              {canFuseStack && (
                                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#d18ce8] animate-pulse" />
                              )}
                              <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-[#ffffff] drop-shadow-[0_1px_1px_#000]">
                                x{item.count}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Vault Item Action Bar */}
                  {selectedVaultItem ? (
                    <div
                      className={`p-2.5 rounded border flex flex-wrap items-center justify-between gap-2 ${
                        RARITY_STYLES[selectedVaultItem.rarity].border
                      } ${RARITY_STYLES[selectedVaultItem.rarity].bg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <PixelGearIcon
                          slot={selectedVaultItem.slot}
                          rarity={selectedVaultItem.rarity}
                          weaponType={selectedVaultItem.weaponType}
                          size={34}
                        />
                        <div>
                          <div className={`text-xs font-black ${RARITY_STYLES[selectedVaultItem.rarity].text}`}>
                            {selectedVaultItem.name}{" "}
                            {selectedVaultItem.ascensionRank > 0 ? `(★${selectedVaultItem.ascensionRank})` : ""} · STACK x
                            {selectedVaultItem.count}
                          </div>
                          <div className="text-[10px] text-[#b8d8cc]">
                            {selectedVaultItem.rarity.toUpperCase()} {SLOT_LABELS[selectedVaultItem.slot]} · Base Copies:{" "}
                            {getBaseCopiesEquivalent(selectedVaultItem.ascensionRank)}x · Sell:{" "}
                            <span className="text-[#ffcf4d] font-bold">{getItemSellValue(selectedVaultItem)}G</span> each
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            updateProfile(equipFromBankToSlot(runState.profile, selectedVaultItem.id));
                            deepSignalAudio.playPickup("gear");
                            showToast(`EQUIPPED ${selectedVaultItem.name.toUpperCase()}`);
                          }}
                          className="px-2.5 py-1 rounded bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-[10px] font-black"
                        >
                          EQUIP
                        </button>

                        {selectedVaultItem.count >= ASCENSION_MERGE_COUNT && (
                          <button
                            type="button"
                            onClick={() => {
                              const { profile: nextP, result } = fuseGearStackInVault(
                                runState.profile,
                                selectedVaultItem.id,
                              );
                              if (result) {
                                updateProfile(nextP);
                                deepSignalAudio.playUiChime("ascend");
                                showToast(`FUSED ${result.itemName.toUpperCase()} -> ★${result.newRank}!`);
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#d18ce8] hover:bg-[#e3aef5] text-[#17071f] text-[10px] font-black"
                          >
                            ✦ FUSE 3 → ★{selectedVaultItem.ascensionRank + 1}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const { profile: nextP, goldEarned } = sellBankItemStack(
                              runState.profile,
                              selectedVaultItem.id,
                              false,
                            );
                            if (goldEarned > 0) {
                              updateProfile(nextP);
                              deepSignalAudio.playUiChime("sell");
                              showToast(`SOLD 1 FOR +${goldEarned}G`);
                            }
                          }}
                          className="px-2 py-1 rounded bg-[#2b220d] hover:bg-[#3d3012] border border-[#8f6d1d] text-[#ffcf4d] text-[10px] font-extrabold"
                        >
                          SELL 1 (+{getItemSellValue(selectedVaultItem)}G)
                        </button>

                        {selectedVaultItem.count > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const { profile: nextP, goldEarned, soldCount } = sellBankItemStack(
                                runState.profile,
                                selectedVaultItem.id,
                                true,
                              );
                              if (goldEarned > 0) {
                                updateProfile(nextP);
                                deepSignalAudio.playUiChime("sell");
                                showToast(`SOLD ${soldCount} FOR +${goldEarned}G`);
                              }
                            }}
                            className="px-2 py-1 rounded bg-[#361614] hover:bg-[#4a1e1b] border border-[#9c362f] text-[#ff9b94] text-[10px] font-extrabold"
                          >
                            SELL ALL (+{getItemSellValue(selectedVaultItem) * selectedVaultItem.count}G)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded border border-[#1a2e27] bg-[#080e0c] text-[11px] text-[#6d8f82]">
                      Select any stack in your Vault to Equip, Fuse (3 copies → +1 Star), or Sell for Gold.
                    </div>
                  )}
                </div>
              </div>
            )}

            {armoryTab === "fusion" && (
              <div className="flex flex-col gap-3">
                <div className="p-2.5 rounded-lg bg-[#170f21] border border-[#4a2b6b]">
                  <div className="text-xs font-black text-[#eabfff]">
                    ✦ EXPONENTIAL ASCENSION FORGE (3 → 9 → 27 → 81...)
                  </div>
                  <div className="text-[11px] text-[#c7a9de]">
                    Merge <strong>3 identical rank copies</strong> into <strong>1 higher-star item</strong> (+28% multiplicative power per star, unlimited ranks).
                  </div>
                </div>

                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5">
                  <div className="text-xs font-extrabold text-[#6fe3c1] mb-2">
                    EQUIPPED ITEMS (FUSE USING 2 MATCHING COPIES FROM VAULT)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_GEAR_SLOTS.map((slot) => {
                      const eq = runState.profile.equippedGear[slot];
                      if (!eq) return null;
                      const vaultMatches = runState.profile.bankedGear
                        .filter(
                          (g) =>
                            g.slot === eq.slot &&
                            g.baseKey === eq.baseKey &&
                            g.rarity === eq.rarity &&
                            g.ascensionRank === eq.ascensionRank,
                        )
                        .reduce((acc, g) => acc + g.count, 0);
                      const canFuseEq = vaultMatches >= ASCENSION_MERGE_COUNT - 1;

                      return (
                        <div
                          key={slot}
                          className={`p-2 rounded border flex items-center justify-between gap-2 ${
                            RARITY_STYLES[eq.rarity].border
                          } ${RARITY_STYLES[eq.rarity].bg}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PixelGearIcon slot={eq.slot} rarity={eq.rarity} weaponType={eq.weaponType} size={26} />
                            <div className="min-w-0">
                              <div className={`text-xs font-extrabold truncate ${RARITY_STYLES[eq.rarity].text}`}>
                                {eq.name} ★{eq.ascensionRank}
                              </div>
                              <div className="text-[10px] text-[#9bc4b4]">
                                Copies: {1 + vaultMatches}/{ASCENSION_MERGE_COUNT} ({getBaseCopiesEquivalent(eq.ascensionRank)}x base)
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canFuseEq}
                            onClick={() => {
                              const { profile: nextP, result } = fuseEquippedWithVaultCopies(runState.profile, slot);
                              if (result) {
                                updateProfile(nextP);
                                deepSignalAudio.playUiChime("ascend");
                                showToast(`ASCENDED ${result.itemName.toUpperCase()} -> ★${result.newRank}!`);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-black shrink-0 ${
                              canFuseEq
                                ? "bg-[#d18ce8] hover:bg-[#e5aef7] text-[#17071f]"
                                : "bg-[#1a1821] text-[#5e566b]"
                            }`}
                          >
                            {canFuseEq ? `FUSE → ★${eq.ascensionRank + 1}` : "NEED 3"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5">
                  <div className="text-xs font-extrabold text-[#6fe3c1] mb-2">
                    VAULT STACKS (3+ COPIES MERGE INTO 1 STAR-UP ITEM)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {runState.profile.bankedGear
                      .filter((g) => g.count >= ASCENSION_MERGE_COUNT)
                      .map((g) => (
                        <div
                          key={g.id}
                          className={`p-2 rounded border flex items-center justify-between gap-2 ${
                            RARITY_STYLES[g.rarity].border
                          } ${RARITY_STYLES[g.rarity].bg}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PixelGearIcon slot={g.slot} rarity={g.rarity} weaponType={g.weaponType} size={24} />
                            <div className="min-w-0">
                              <div className={`text-xs font-extrabold truncate ${RARITY_STYLES[g.rarity].text}`}>
                                {g.name} ★{g.ascensionRank}
                              </div>
                              <div className="text-[10px] text-[#b8d8cc]">
                                Stack: x{g.count} · Base: {getBaseCopiesEquivalent(g.ascensionRank)}x
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const { profile: nextP, result } = fuseGearStackInVault(runState.profile, g.id);
                              if (result) {
                                updateProfile(nextP);
                                deepSignalAudio.playUiChime("ascend");
                                showToast(`MERGED 3x -> ${result.itemName.toUpperCase()} ★${result.newRank}!`);
                              }
                            }}
                            className="px-2 py-1 rounded bg-[#d18ce8] hover:bg-[#e5aef7] text-[#17071f] text-[10px] font-black shrink-0"
                          >
                            3 → ★{g.ascensionRank + 1}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {armoryTab === "index" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-black text-[#6fe3c1]">
                    SUBTERRANEAN ITEM INDEX ({runState.profile.discoveredItems.length} / {FULL_ITEM_CATALOG.length} DISCOVERED)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(["all", ...ALL_GEAR_SLOTS] as const).map((slotKey) => (
                      <button
                        key={slotKey}
                        type="button"
                        onClick={() => setIndexSlotFilter(slotKey)}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          indexSlotFilter === slotKey
                            ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                            : "bg-[#0e1a16] text-[#9bc4b4] border-[#253f36]"
                        }`}
                      >
                        {slotKey === "all" ? "ALL (105)" : SLOT_LABELS[slotKey]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredCatalog.map((bp) => {
                    const discovered = runState.profile.discoveredItems.includes(bp.baseKey);
                    return (
                      <div
                        key={bp.baseKey}
                        className={`p-2 rounded border flex items-center gap-2 ${
                          discovered
                            ? `${RARITY_STYLES[bp.rarity].border} ${RARITY_STYLES[bp.rarity].bg}`
                            : "border-[#182923] bg-[#080e0c] opacity-60"
                        }`}
                      >
                        <div className={discovered ? "" : "brightness-0 invert opacity-25"}>
                          <PixelGearIcon slot={bp.slot} rarity={bp.rarity} weaponType={bp.weaponType} size={24} />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-[10px] font-extrabold truncate ${
                              discovered ? RARITY_STYLES[bp.rarity].text : "text-[#587067]"
                            }`}
                          >
                            {discovered ? bp.name : "??? UNDISCOVERED"}
                          </div>
                          <div className="text-[9px] text-[#7ca394]">
                            {bp.rarity} · {SLOT_LABELS[bp.slot]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {armoryTab === "skins" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="font-black text-[#6fe3c1]">SURVEYOR EXPEDITION SUITS</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SURVEYOR_SKINS.map((sk) => {
                      const unlocked = runState.profile.unlockedSkins.includes(sk.id);
                      const active = runState.profile.activeSkin === sk.id;
                      return (
                        <button
                          key={sk.id}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => updateProfile(setSurveyorSkin(runState.profile, sk.id))}
                          className={`p-2 rounded border text-left ${
                            active
                              ? "border-[#6fe3c1] bg-[#132922]"
                              : unlocked
                                ? "border-[#253f36] bg-[#09110e]"
                                : "border-[#16241f] bg-[#070c0a] opacity-55"
                          }`}
                        >
                          <div className="font-extrabold text-[11px] text-[#e6f5ee]">{sk.name}</div>
                          <div className="text-[9px] text-[#8fb5a6]">{unlocked ? "UNLOCKED" : sk.unlockNote}</div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="font-black text-[#6fe3c1] mt-1">HOSTILE ARCHIVES</div>
                  <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                    {Object.values(ENEMY_LORE_CODEX).map((entry) => {
                      const seen = runState.profile.discoveredEnemies.includes(entry.id);
                      return (
                        <div key={entry.id} className="p-2 rounded bg-[#080e0c] border border-[#1a2e27]">
                          <div className="font-bold text-[11px] text-[#e6f5ee]">
                            {seen ? `${entry.title} · ${entry.abilityName}` : "🔒 UNIDENTIFIED SIGNAL"}
                          </div>
                          {seen && <div className="text-[10px] text-[#9bc4b4] mt-0.5">{entry.lore}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-2">
                  <div className="font-black text-[#ffcf56]">SECTOR GUARDIANS &amp; SIGNAL TAPES</div>
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                    {SIGNAL_TAPES_DB.map((t) => {
                      const unlocked =
                        runState.profile.decodedTapes.includes(t.id) ||
                        runState.profile.unlockedSignalLinks.includes(t.floorFound);
                      const bossSpec = getBossSpecForFloor(t.floorFound);
                      return (
                        <div
                          key={t.id}
                          className="p-2 rounded bg-[#080e0c] border border-[#1f362e] flex items-center gap-2.5"
                        >
                          {unlocked ? (
                            <BossMiniPreviewCanvas bossSpec={bossSpec} />
                          ) : (
                            <div className="w-[112px] h-[112px] rounded-lg border border-[#1a2e27] bg-[#060a09] flex items-center justify-center text-xs text-[#4b695e] shrink-0">
                              LOCKED F{t.floorFound}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-[11px] text-[#ffdf6b]">
                              {unlocked ? bossSpec.name : `🔒 GUARDIAN F${t.floorFound}`}
                            </div>
                            <div className="text-[10px] font-bold text-[#6fe3c1]">
                              {unlocked ? `${bossSpec.title} · ${bossSpec.abilityLabel}` : "Defeat Floor Boss to Decode"}
                            </div>
                            {unlocked && (
                              <div className="text-[10px] text-[#9bc4b4] mt-1 leading-snug">
                                “{t.transcript}”
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuriedComplexGame;
