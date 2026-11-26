import { useEffect, useRef, useState } from "react";
import { deepSignalAudio } from "../lib/deep-signal-audio";
import {
  SURVEYOR_SKINS,
  drawExactBoss,
  drawExactEnemy,
  drawExactSurveyor,
  drawPixelBlocker,
  drawPixelProp,
  drawPixelatedRoomMap,
} from "../lib/Pixel-skins";
import {
  ALL_GEAR_SLOTS,
  ASCENSION_MERGE_COUNT,
  BIOMES,
  CHARGE_FULL_MS,
  ENEMY_LORE_CODEX,
  FULL_ITEM_CATALOG,
  MAX_SLOT_UPGRADE_LEVEL,
  SIGNAL_TAPES_DB,
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
  getGearSellValue,
  getMultiSlotUpgradePlan,
  makeGearFromBlueprint,
  sellBankItemStack,
  sellFilteredBankItems,
  setSurveyorSkin,
  skipTrainingTutorial,
  startDeepSignalRun,
  stepDeepSignalRun,
  unequipAllSlotsToBank,
  unequipSlotToBank,
  upgradeEquippedSlotBulkWithGold,
  type BossSpec,
  type DeepSignalRun,
  type Enemy,
  type EnemyClassId,
  type GearItem,
  type GearRarity,
  type GearSlot,
  type PlayerInput,
  type RoomBlocker,
  type WeaponArchetype,
} from "../lib/deep-signal-engine";
import {
  VAULT_PAGE_SIZE,
  VAULT_TOTAL_PAGES,
  loadSurveyorProfile,
  resetSurveyorProfile,
  saveSurveyorProfile,
  type SurveyorProfile,
} from "../lib/deep-signal-store";

type KeyMap = Record<string, boolean>;

const RARITY_STYLES: Record<GearRarity, { border: string; bg: string; text: string; hex: string }> = {
  Common: { border: "border-[#637870]", bg: "bg-[#141f1c]", text: "text-[#c4d6cf]", hex: "#9eb3ab" },
  Uncommon: { border: "border-[#54c496]", bg: "bg-[#11261f]", text: "text-[#79f2cc]", hex: "#6fe3c1" },
  Rare: { border: "border-[#57a6ff]", bg: "bg-[#112033]", text: "text-[#7cc0ff]", hex: "#63b3ff" },
  Epic: { border: "border-[#b87aff]", bg: "bg-[#201333]", text: "text-[#d4a8ff]", hex: "#b87aff" },
  Legendary: { border: "border-[#ffcf56]", bg: "bg-[#2b200e]", text: "text-[#ffe082]", hex: "#ffcf56" },
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

function getWeaponPalette(rarity?: GearRarity, weaponType?: WeaponArchetype) {
  const type = weaponType ?? "Sword";
  if (type === "Executioner" || rarity === "Legendary") {
    return { blade: "#ffd84d", edge: "#fff7bd", hilt: "#b37412", gem: "#ff2e2e" };
  }
  if (type === "Plasma Cleaver" || rarity === "Epic") {
    return { blade: "#f238ff", edge: "#ffb8ff", hilt: "#4a1766", gem: "#ffffff" };
  }
  if (type === "Broadsword" || rarity === "Rare") {
    return { blade: "#6ef538", edge: "#d4ffb8", hilt: "#2e473b", gem: "#ffffff" };
  }
  if (type === "Rapier" || rarity === "Uncommon") {
    return { blade: "#4da6ff", edge: "#bfe3ff", hilt: "#d49b24", gem: "#e8f7ff" };
  }
  return { blade: "#c4ced4", edge: "#f5f9fa", hilt: "#c99426", gem: "#ffffff" };
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
  const pal = getWeaponPalette(rarity, weaponType);
  const isHighTier = rarity === "Epic" || rarity === "Legendary";

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" className="shrink-0" aria-hidden="true">
      {isHighTier && <rect x="2" y="2" width="12" height="12" fill={pal.blade} fillOpacity="0.16" />}
      {slot === "weapon" && (
        <>
          {weaponType === "Rapier" ? (
            <>
              <rect x="12" y="2" width="2" height="2" fill={pal.edge} />
              <rect x="10" y="4" width="2" height="2" fill={pal.blade} />
              <rect x="8" y="6" width="2" height="2" fill={pal.blade} />
              <rect x="6" y="8" width="2" height="2" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="2" fill="#f2c138" />
              <rect x="6" y="10" width="2" height="3" fill="#f2c138" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          ) : weaponType === "Broadsword" ? (
            <>
              <rect x="10" y="2" width="4" height="4" fill={pal.edge} />
              <rect x="8" y="4" width="4" height="4" fill={pal.blade} />
              <rect x="6" y="6" width="4" height="4" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="2" fill="#f5f9fa" />
              <rect x="6" y="10" width="2" height="4" fill="#f5f9fa" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          ) : weaponType === "Plasma Cleaver" ? (
            <>
              <rect x="9" y="2" width="5" height="2" fill={pal.edge} />
              <rect x="7" y="4" width="6" height="3" fill={pal.blade} />
              <rect x="5" y="6" width="6" height="3" fill={pal.blade} />
              <rect x="4" y="8" width="4" height="2" fill="#4a1766" />
              <rect x="2" y="11" width="3" height="3" fill={pal.hilt} />
            </>
          ) : weaponType === "Executioner" ? (
            <>
              <rect x="10" y="1" width="5" height="5" fill={pal.blade} />
              <rect x="12" y="1" width="3" height="3" fill={pal.edge} />
              <rect x="8" y="4" width="4" height="4" fill={pal.blade} />
              <rect x="6" y="6" width="4" height="4" fill={pal.blade} />
              <rect x="3" y="8" width="6" height="2" fill="#ffd84d" />
              <rect x="5" y="9" width="2" height="2" fill="#ff2e2e" />
              <rect x="2" y="12" width="3" height="3" fill={pal.hilt} />
            </>
          ) : (
            <>
              <rect x="11" y="2" width="3" height="2" fill={pal.edge} />
              <rect x="9" y="4" width="3" height="2" fill={pal.blade} />
              <rect x="7" y="6" width="3" height="2" fill={pal.blade} />
              <rect x="5" y="8" width="3" height="2" fill={pal.blade} />
              <rect x="3" y="8" width="5" height="2" fill="#d9a226" />
              <rect x="6" y="10" width="2" height="4" fill="#d9a226" />
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

// Live Interactive Mini-Surveyor Paperdoll (tracks cursor like Minecraft inventory & renders equipped/held items)
export function SurveyorPaperdollCanvas({
  skinId,
  equipped,
  previewItem,
  width = 112,
  height = 112,
}: {
  skinId: string;
  equipped: Partial<Record<GearSlot, GearItem>>;
  previewItem?: GearItem | null;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lookRef = useRef<{ fx: number; fy: number }>({ fx: 1, fy: 0 });

  useEffect(() => {
    let raf = 0;
    const render = (now: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "#070c0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(111, 227, 193, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 14) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 14) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.fillStyle = "#162923";
        ctx.fillRect(Math.round(canvas.width / 2 - 26), Math.round(canvas.height * 0.78), 52, 8);
        ctx.fillStyle = "#6fe3c1";
        ctx.fillRect(Math.round(canvas.width / 2 - 24), Math.round(canvas.height * 0.78), 48, 2);

        ctx.save();
        ctx.translate(Math.round(canvas.width / 2), Math.round(canvas.height * 0.64));
        ctx.scale(1.65, 1.65);
        drawExactSurveyor(ctx, 0, 0, lookRef.current.fx, lookRef.current.fy, skinId, equipped, {
          walkPhase: now * 0.004,
          previewItem,
        });
        ctx.restore();
      }
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [skinId, equipped, previewItem]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const len = Math.max(1, Math.hypot(dx, dy));
        lookRef.current = { fx: dx / len, fy: (dy / len) * 0.45 };
      }}
      onMouseLeave={() => {
        lookRef.current = { fx: 1, fy: 0 };
      }}
      className="rounded-lg border border-[#2d4a40] bg-[#070c0a] shrink-0 cursor-crosshair"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function EnemyMiniPreviewCanvas({ enemyKind }: { enemyKind: EnemyClassId }) {
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

        const dummyEnemy: Enemy = {
          id: 1,
          kind: enemyKind,
          weapon: "Sword",
          x: 0,
          y: 0,
          z: 0,
          health: 100,
          maxHealth: 100,
          speed: 0,
          damage: 10,
          flankAngle: 0,
          windupMs: 0,
          maxWindupMs: 400,
          abilityCooldownMs: 0,
          specialWindupMs: 0,
          maxSpecialWindupMs: 400,
          specialType: "none",
          aimTargetX: 0,
          aimTargetY: 0,
          diveStartX: 0,
          diveStartY: 0,
          attackCooldownMs: 0,
          stunMs: 0,
          hitFlashMs: 0,
          facingX: -1,
          facingY: 0,
          strafeSign: 1,
          stolenGold: 0,
          stolenDiamonds: 0,
          stealEscapeTimerMs: 0,
          groundedVulnerableMs: 0,
          perchX: 0,
          perchY: 0,
          spawnTimerMs: 0,
          barrageRemainingMs: 0,
          barrageShotTimerMs: 0,
        };

        ctx.save();
        ctx.translate(Math.round(canvas.width / 2), Math.round(canvas.height * 0.68));
        ctx.scale(1.85, 1.85);
        drawExactEnemy(ctx, dummyEnemy, now);
        ctx.restore();
      }
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [enemyKind]);

  return (
    <canvas
      ref={canvasRef}
      width={104}
      height={104}
      className="rounded-lg border border-[#2d4a40] bg-[#070c0a] shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
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

        drawExactBoss(ctx, canvas.width / 2, canvas.height * 0.72, -1, 0, bossSpec, now, {
          scaleOverride: 1.75,
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
      width={104}
      height={104}
      className="rounded-lg border border-[#2d4a40] bg-[#070c0a] shrink-0"
      style={{ imageRendering: "pixelated" }}
    />
  );
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

  const scrollOffset = state.status === "title" ? nowMs * 0.035 : state.player.x * 0.08;
  drawPixelatedRoomMap(ctx, WORLD_WIDTH, WORLD_HEIGHT, biome, nowMs, scrollOffset);

  if (state.status === "title") {
    const walkX = 120 + ((nowMs * 0.05) % (WORLD_WIDTH - 240));
    drawExactSurveyor(
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
    drawExactSurveyor(
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
  const exitLabel = state.status === "training" ? (state.roomCleared ? "CAVE ENTRANCE" : "DRILLS") : state.roomCleared ? "EXTRACT" : "LOCKED";
  ctx.fillText(exitLabel, liftX + 27, liftY - 6);

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

  for (const prop of state.currentRoom.props) {
    drawPixelProp(ctx, prop, biome.id, biome.accentColor, nowMs);
  }

  // Exact Thin/Oval Gold Coins & Pointed Sapphire Gems (matching friend's sprite sheet)
  const hoverBob = Math.sin(nowMs * 0.008) * 2;
  const coinSpinPhase = Math.floor(nowMs / 170) % 2 === 0;
  for (const pk of state.pickups) {
    const px = Math.round(pk.x);
    const py = Math.round(pk.y - pk.z + hoverBob);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(px - 6, Math.round(pk.y + 9), 12, 3);

    if (pk.goldAmount) {
      if (coinSpinPhase) {
        ctx.fillStyle = "#8c6208";
        ctx.fillRect(px - 5, py - 6, 10, 12);
        ctx.fillStyle = "#f5c425";
        ctx.fillRect(px - 4, py - 5, 8, 10);
        ctx.fillStyle = "#fff380";
        ctx.fillRect(px - 3, py - 4, 3, 4);
      } else {
        ctx.fillStyle = "#8c6208";
        ctx.fillRect(px - 2, py - 6, 4, 12);
        ctx.fillStyle = "#fff380";
        ctx.fillRect(px - 1, py - 5, 2, 10);
      }
    } else if (pk.diamondAmount) {
      ctx.fillStyle = "#10216b";
      ctx.fillRect(px - 2, py - 8, 4, 16);
      ctx.fillRect(px - 4, py - 6, 8, 12);
      ctx.fillRect(px - 6, py - 4, 12, 8);
      ctx.fillStyle = "#3a66f2";
      ctx.fillRect(px - 2, py - 6, 4, 12);
      ctx.fillRect(px - 4, py - 4, 8, 8);
      ctx.fillStyle = "#80e8ff";
      ctx.fillRect(px - 2, py - 4, 2, 4);
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
      drawPixelBlocker(ctx, entry.blocker, biome.trimColor, biome.accentColor, biome.id);
    } else if (entry.kind === "enemy") {
      drawExactEnemy(ctx, entry.enemy, nowMs);
    } else {
      const moving = Math.hypot(state.player.vx, state.player.vy) > 10;
      const chargeRatio = state.player.chargeHoldMs / CHARGE_FULL_MS;
      drawExactSurveyor(
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
          chargeRatio,
        },
      );

      if (state.player.attackMs > 0) {
        const ang = Math.atan2(state.player.facingY, state.player.facingX);
        ctx.save();
        ctx.strokeStyle = state.player.lastSwingCharged ? "#ffcf56" : "#6fe3c1";
        ctx.lineWidth = state.player.lastSwingCharged ? 5 : 3;
        ctx.beginPath();
        ctx.arc(
          state.player.x,
          state.player.y - 2,
          state.player.lastSwingCharged ? 46 : 34,
          ang - (state.player.lastSwingCharged ? 1.2 : 0.85),
          ang + (state.player.lastSwingCharged ? 1.2 : 0.85),
        );
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  for (const proj of state.projectiles) {
    if (proj.isArrow) {
      const ang = Math.atan2(proj.vy, proj.vx);
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#144d17";
      ctx.fillRect(-8, -2, 16, 4);
      ctx.fillStyle = proj.color;
      ctx.fillRect(-7, -1, 14, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(4, -2, 4, 4);
      ctx.restore();
    } else {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.explosive ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.explosive ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
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
  const [armoryTab, setArmoryTab] = useState<"vault" | "fusion" | "book">("vault");
  const [bookChapter, setBookChapter] = useState<"map" | "index" | "suits" | "enemies" | "bosses">("map");
  const [selectedIndexBaseKey, setSelectedIndexBaseKey] = useState<string>(FULL_ITEM_CATALOG[0]!.baseKey);
  const [selectedEnemyCodexId, setSelectedEnemyCodexId] = useState<EnemyClassId>("stalker");
  const [selectedBossFloor, setSelectedBossFloor] = useState<number>(10);
  const [previewSuitId, setPreviewSuitId] = useState<string>(() => loadSurveyorProfile().activeSkin);
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
  const [touchMode, setTouchMode] = useState<boolean>(() =>
    typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0),
  );
  const [stickKnob, setStickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStickRef = useRef<{ active: boolean; id: number | null; cx: number; cy: number; mx: number; my: number }>({
    active: false,
    id: null,
    cx: 0,
    cy: 0,
    mx: 0,
    my: 0,
  });

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
    } else if (runState.status === "playing" || runState.status === "training") {
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

  // Q or I/Tab closes/toggles the Armory & Field Book without exiting browser fullscreen!
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === "Tab" || code === "KeyI") {
        e.preventDefault();
        setShowArmory((prev) => !prev);
        return;
      }
      if (code === "KeyQ") {
        setShowArmory((prev) => (prev ? false : prev));
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
      const kbX = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
      const kbY = (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0) - (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0);
      const stick = touchStickRef.current;
      const moveX = stick.active ? stick.mx : kbX;
      const moveY = stick.active ? stick.my : kbY;

      let lookX = mouseLookRef.current.active ? mouseLookRef.current.x : moveX;
      let lookY = mouseLookRef.current.active ? mouseLookRef.current.y : moveY;
      if (stick.active && Math.hypot(stick.mx, stick.my) > 0.15) {
        lookX = stick.mx;
        lookY = stick.my;
      }

      const input: PlayerInput = {
        moveX,
        moveY,
        lookX,
        lookY,
        attack: Boolean(keys["KeyJ"] || keys["MouseLeft"]),
        guard: Boolean(keys["KeyK"] || keys["ShiftLeft"] || keys["ShiftRight"] || keys["MouseRight"]),
        dodge: Boolean(keys["Space"]),
        interact: Boolean(keys["KeyE"]),
      };

      if (!showArmory && (runStateRef.current.status === "playing" || runStateRef.current.status === "training")) {
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
        nextProfile.activeSkin,
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
    runState.profile.activeSkin,
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

  const floorNum = runState.status === "training" ? 0 : runState.roomIndex + 1;
  const hpPct = Math.max(0, Math.min(100, (runState.player.health / Math.max(1, runState.player.maxHealth)) * 100));
  const staPct = Math.max(0, Math.min(100, (runState.player.stamina / Math.max(1, runState.player.maxStamina)) * 100));
  const chargePct = Math.min(100, Math.round((runState.player.chargeHoldMs / CHARGE_FULL_MS) * 100));
  const totalMinutesPlayed = Math.floor(runState.profile.totalTimePlayedMs / 60000);
  const formattedPlayTime = `${Math.floor(totalMinutesPlayed / 60)}h ${String(totalMinutesPlayed % 60).padStart(2, "0")}m`;

  const selectedIndexBlueprint =
    FULL_ITEM_CATALOG.find((b) => b.baseKey === selectedIndexBaseKey) ?? FULL_ITEM_CATALOG[0]!;
  const selectedIndexPreviewGear = makeGearFromBlueprint(selectedIndexBlueprint, Math.max(1, floorNum));

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#070d0b] text-[#e6f5ee] font-mono flex flex-col items-center justify-center p-2.5 select-none"
    >
      {/* Top Arcade & Currency Header */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              deepSignalAudio.updateMusicState("off", "outer-bunker");
              onBackToArcade();
            }}
            className="px-3 py-1.5 rounded-lg bg-[#121f1b] hover:bg-[#1a2e28] border border-[#2b453c] text-xs font-bold text-[#9be8cf]"
          >
            ← JB PLAYNET
          </button>
          <span className="text-xs font-extrabold tracking-widest text-[#6fe3c1]">
            THE SIGNAL BELOW · v4.0
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2.5 py-1.5 rounded-lg bg-[#1d190c] border border-[#6e5619] text-[#ffcf4d] font-bold">
            GOLD: {runState.profile.gold + runState.carriedGold}
          </span>
          <span className="px-2.5 py-1.5 rounded-lg bg-[#0c1b26] border border-[#23567a] text-[#5ec8ff] font-bold">
            GEMS: {runState.profile.diamonds + runState.carriedDiamonds}
          </span>
          <button
            type="button"
            onClick={() => setShowArmory((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-lg bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-extrabold"
          >
            {showArmory ? "RESUME [Q]" : "ARMORY & BOOK [I]"}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(deepSignalAudio.toggleMute())}
            className="px-2.5 py-1.5 rounded-lg bg-[#121f1b] border border-[#2b453c] text-[#b8d8cc] font-bold"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 rounded-lg bg-[#121f1b] border border-[#2b453c] text-[#b8d8cc] font-bold"
          >
            {isFullscreen ? "EXIT FULL" : "FULL"}
          </button>
          <button
            type="button"
            onClick={() => setTouchMode((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
              touchMode
                ? "bg-[#19382e] border-[#6fe3c1] text-[#8ef7d8]"
                : "bg-[#121f1b] border-[#2b453c] text-[#b8d8cc]"
            }`}
          >
            {touchMode ? "TOUCH ON" : "TOUCH"}
          </button>
        </div>
      </div>

      {/* Main 2.5D Viewport Frame (Slightly Bigger max-w-5xl so menus fit with ZERO scrolling) */}
      <div className="relative w-full max-w-5xl rounded-xl overflow-hidden border-2 border-[#263f36] bg-[#080f0d] shadow-2xl">
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

              {chargePct > 5 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${chargePct >= 100 ? "bg-[#ffcf56] text-[#171203]" : "bg-[#142b24] text-[#6fe3c1]"}`}>
                  {chargePct >= 100 ? "2X READY!" : `CHARGE ${chargePct}%`}
                </span>
              )}

              <span className="text-[#ffcf56] font-bold">ATK {computedStats.totalAttack}</span>
              <span className="text-[#9bc4b4]">LV.{runState.player.level}</span>
            </div>

            <div className="font-extrabold tracking-wider text-[#6fe3c1]">
              {runState.currentRoom.name}
            </div>

            <div className="text-[11px] text-[#9bc4b4]">
              HAUL: <span className="text-[#ffcf4d] font-bold">{runState.carriedGold}G</span> ·{" "}
              <span className="text-[#5ec8ff] font-bold">{runState.carriedDiamonds} GEM</span> ·{" "}
              <span className="text-[#e6f5ee] font-bold">
                {runState.carriedGear.reduce((a, b) => a + b.count, 0)} GEAR
              </span>
            </div>
          </div>
        )}

        {/* Sector 0 Interactive Training Dummy Quest Banner */}
        {runState.status === "training" && !showArmory && (
          <div className="px-4 py-2 bg-[#0d1c17] border-b border-[#2e5245] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#ffcf56] text-[#171203] font-black text-[10px]">
                SECTOR 0 · TRAINING DRILL {runState.enemies.length === 0 ? "4/4 DONE" : `${runState.tutorialStep}/4`}
              </span>
              <span className="font-bold text-[#e6f5ee]">{runState.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setRunState((prev) => skipTrainingTutorial(prev))}
              className="px-2.5 py-1 rounded bg-[#182b24] hover:bg-[#233d33] border border-[#3d6959] text-[10px] font-black text-[#9be8cf]"
            >
              SKIP TO FLOOR 01 →
            </button>
          </div>
        )}

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

        {toastMsg && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded bg-[#0d1c17] border border-[#6fe3c1] text-[#8ef7d8] text-xs font-extrabold shadow-lg">
            {toastMsg}
          </div>
        )}

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

        {touchMode && (runState.status === "playing" || runState.status === "training") && !showArmory && (
          <div className="absolute inset-0 pointer-events-none flex items-end justify-between p-4 z-10 select-none">
            <div
              onTouchStart={(e) => {
                const t = e.changedTouches.item(0);
                if (!t) return;
                const rect = e.currentTarget.getBoundingClientRect();
                touchStickRef.current = {
                  active: true,
                  id: t.identifier,
                  cx: rect.left + rect.width / 2,
                  cy: rect.top + rect.height / 2,
                  mx: 0,
                  my: 0,
                };
                setStickKnob({ x: 0, y: 0 });
              }}
              onTouchMove={(e) => {
                const st = touchStickRef.current;
                if (!st.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                  const t = e.changedTouches[i];
                  if (t && t.identifier === st.id) {
                    const maxR = 38;
                    const dx = t.clientX - st.cx;
                    const dy = t.clientY - st.cy;
                    const dist = Math.hypot(dx, dy);
                    const clamped = Math.min(maxR, dist);
                    const ang = Math.atan2(dy, dx);
                    const kx = dist > 4 ? Math.cos(ang) * clamped : 0;
                    const ky = dist > 4 ? Math.sin(ang) * clamped : 0;
                    st.mx = kx / maxR;
                    st.my = ky / maxR;
                    setStickKnob({ x: kx, y: ky });
                  }
                }
              }}
              onTouchEnd={() => {
                touchStickRef.current = { active: false, id: null, cx: 0, cy: 0, mx: 0, my: 0 };
                setStickKnob({ x: 0, y: 0 });
              }}
              onTouchCancel={() => {
                touchStickRef.current = { active: false, id: null, cx: 0, cy: 0, mx: 0, my: 0 };
                setStickKnob({ x: 0, y: 0 });
              }}
              className="pointer-events-auto w-28 h-28 rounded-full bg-[#0a1411]/70 border-2 border-[#6fe3c1]/50 flex items-center justify-center touch-none"
            >
              <div
                style={{ transform: `translate(${stickKnob.x}px, ${stickKnob.y}px)` }}
                className="w-11 h-11 rounded-full bg-[#6fe3c1]/85 border-2 border-[#ffffff] shadow-lg"
              />
            </div>

            <div className="pointer-events-auto flex items-end gap-2.5 touch-none">
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current["Space"] = true;
                }}
                onTouchEnd={() => {
                  keysRef.current["Space"] = false;
                }}
                onTouchCancel={() => {
                  keysRef.current["Space"] = false;
                }}
                className="w-14 h-14 rounded-full bg-[#1a2b36]/85 active:bg-[#5ec8ff] border-2 border-[#5ec8ff] text-[10px] font-black text-[#e6f7ff] shadow-lg"
              >
                DASH
              </button>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current["KeyK"] = true;
                }}
                onTouchEnd={() => {
                  keysRef.current["KeyK"] = false;
                }}
                onTouchCancel={() => {
                  keysRef.current["KeyK"] = false;
                }}
                className="w-16 h-16 rounded-full bg-[#2b220d]/85 active:bg-[#ffcf56] border-2 border-[#ffcf56] text-[11px] font-black text-[#ffe699] shadow-lg"
              >
                GUARD
              </button>

              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  keysRef.current["KeyJ"] = true;
                }}
                onTouchEnd={() => {
                  keysRef.current["KeyJ"] = false;
                }}
                onTouchCancel={() => {
                  keysRef.current["KeyJ"] = false;
                }}
                className="w-20 h-20 rounded-full bg-[#6fe3c1]/90 active:bg-[#ffffff] border-2 border-[#ffffff] text-xs font-black text-[#06120e] shadow-xl"
              >
                SLASH
              </button>
            </div>
          </div>
        )}

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
                    className="px-3.5 py-2 rounded-lg bg-[#2b1010] hover:bg-[#3d1515] border border-[#8f2929] text-[#ff8a80] text-xs font-bold"
                  >
                    WIPE SAVE
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[#240c0c] border border-[#ff5442] px-3 py-1.5 rounded-lg text-xs">
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
                      className="px-3 py-1 rounded bg-[#ff5442] text-[#080f0d] font-extrabold"
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmWipe(false)}
                      className="px-3 py-1 rounded bg-[#182621] text-[#d8eee4] font-bold"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center my-auto">
              <div className="text-xs tracking-[0.3em] text-[#6fe3c1] font-bold mb-1">
                JB PLAYNET FLAGSHIP EXTRACTION ARPG · v4.0
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-[#f2fff9] drop-shadow-[0_3px_0_#133027]">
                THE SIGNAL BELOW
              </h1>
              <p className="text-xs text-[#9ec4b5] mt-2 max-w-md mx-auto">
                Push through 12 subterranean sectors. Charge-cleave (2x DMG), invincible-dash through hazards, and extract alive.
              </p>

              {runState.profile.unlockedSignalLinks.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#8fb5a6] font-bold">DEPLOY FLOOR:</span>
                  {runState.profile.unlockedSignalLinks.map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setSelectedStartFloor(fl)}
                      className={`px-3 py-1 rounded-md text-xs font-extrabold border ${
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

              <div className="mt-5 flex items-center justify-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    deepSignalAudio.playUiChime("extract");
                    setRunState((prev) => ({ ...prev, status: "entering-cave" }));
                  }}
                  className="px-8 py-3.5 rounded-xl bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-black text-base tracking-wider shadow-lg"
                >
                  ▶ START DESCENT (F{String(selectedStartFloor).padStart(2, "0")})
                </button>
                <button
                  type="button"
                  onClick={() => setShowArmory(true)}
                  className="px-6 py-3.5 rounded-xl bg-[#13221d] hover:bg-[#1b3029] border-2 border-[#34574b] text-[#d8eee4] font-extrabold text-sm"
                >
                  ARMORY &amp; FIELD BOOK
                </button>
              </div>
            </div>

            <div className="text-center text-[11px] text-[#7ca394]">
              MOVE: WASD · SLASH / HOLD 0.9s (2X CHARGE): CLICK / J · SHIELD PARRY: RIGHT-CLICK / SHIFT · INVINCIBLE DASH: SPACE · MENU: [I] / CLOSE: [Q]
            </div>
          </div>
        )}

        {runState.status === "entering-cave" && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
            <div className="text-xs font-extrabold tracking-widest text-[#6fe3c1]">
              ENTERING BTC SUBTERRANEAN COMPLEX · FLOOR {String(selectedStartFloor).padStart(2, "0")}...
            </div>
            <div className="self-end pointer-events-auto">
              <button
                type="button"
                onClick={() => setRunState((prev) => startDeepSignalRun(prev, selectedStartFloor))}
                className="px-4 py-2 rounded-lg bg-[#0d1c17] border border-[#6fe3c1] text-xs font-bold text-[#d8eee4]"
              >
                SKIP →
              </button>
            </div>
          </div>
        )}

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
              className="px-8 py-3.5 rounded-xl bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] font-black text-sm tracking-wider shadow-lg"
            >
              CONTINUE TO EXTRACTION LIFT →
            </button>
          </div>
        )}

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
                    className="p-3.5 rounded-lg bg-[#0d1c26] border border-[#2a4f66] flex flex-col justify-between gap-2.5"
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
                      className={`w-full py-2.5 rounded-lg text-xs font-extrabold ${
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

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  deepSignalAudio.playUiChime("extract");
                  const next = extractWithLoot(runState);
                  saveSurveyorProfile(next.profile);
                  setRunState(next);
                }}
                className="px-6 py-3 rounded-xl bg-[#2b220d] border border-[#ffcf56] text-[#ffe394] text-sm font-extrabold"
              >
                EXTRACT &amp; BANK ALL
              </button>
              <button
                type="button"
                onClick={() => setRunState((prev) => descendToNextFloor(prev))}
                className="px-7 py-3 rounded-xl bg-[#6fe3c1] text-[#06120e] text-sm font-black"
              >
                DESCEND TO FLOOR {floorNum + 1} →
              </button>
            </div>
          </div>
        )}

        {runState.status === "floor-clear" && !showArmory && (
          <div className="absolute inset-0 bg-[#060c0a]/88 flex flex-col items-center justify-center p-5 gap-3 text-center">
            <div className="text-2xl font-black text-[#6fe3c1]">
              FLOOR {String(floorNum).padStart(2, "0")} CLEARED!
            </div>
            <div className="text-xs text-[#b8d8cc]">
              Unbanked Haul: <span className="text-[#ffcf4d] font-bold">{runState.carriedGold} Gold</span> ·{" "}
              <span className="text-[#5ec8ff] font-bold">{runState.carriedDiamonds} Gems</span> ·{" "}
              <span className="font-bold">{runState.carriedGear.reduce((a, b) => a + b.count, 0)} Gear</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              <button
                type="button"
                onClick={() => {
                  deepSignalAudio.playUiChime("extract");
                  const next = extractWithLoot(runState);
                  saveSurveyorProfile(next.profile);
                  setRunState(next);
                  setShowArmory(true);
                }}
                className="px-6 py-3 rounded-xl bg-[#2b220d] hover:bg-[#3b2f12] border-2 border-[#ffcf56] text-[#ffe394] text-sm font-extrabold"
              >
                EXTRACT &amp; OPEN ARMORY
              </button>
              <button
                type="button"
                onClick={() => setRunState((prev) => descendToNextFloor(prev))}
                className="px-7 py-3 rounded-xl bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-sm font-black"
              >
                DESCEND TO FLOOR {floorNum + 1} →
              </button>
            </div>
          </div>
        )}

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
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowArmory(true)}
                  className="px-6 py-3 rounded-xl bg-[#13221d] border-2 border-[#6fe3c1] text-[#d8eee4] text-sm font-extrabold"
                >
                  OPEN ARMORY &amp; FIELD BOOK
                </button>
                {runState.status === "victory-ending" && (
                  <button
                    type="button"
                    onClick={() => setRunState((prev) => continueOverdriveAfterEnding(prev))}
                    className="px-6 py-3 rounded-xl bg-[#ffcf56] text-[#1a1304] text-sm font-black"
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
                  className="px-7 py-3 rounded-xl bg-[#6fe3c1] text-[#06120e] text-sm font-black"
                >
                  DEPLOY AGAIN (F{String(Math.max(selectedStartFloor, Math.max(1, ...runState.profile.unlockedSignalLinks))).padStart(2, "0")})
                </button>
              </div>
            </div>
          )}

        {/* ZERO-SCROLL ARMORY & 5-BOOKMARK SURVEYOR FIELD BOOK */}
        {showArmory && (
          <div className="absolute inset-0 bg-[#060b09]/98 flex flex-col p-2.5 gap-2 overflow-hidden z-30">
            {/* Single-Row Top Bar (3 Tabs + Q Close) */}
            <div className="flex items-center justify-between gap-2 border-b border-[#1d322b] pb-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: "vault", label: "GEAR & VAULT" },
                    { id: "fusion", label: "FUSION (3 → 9 → 27)" },
                    { id: "book", label: "FIELD BOOK (5 CHAPTERS)" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setArmoryTab(t.id);
                      if (t.id === "book") {
                        setSelectedBossFloor(
                          Math.min(100, Math.max(10, Math.ceil(Math.max(1, runState.profile.lastBattledFloor) / 10) * 10)),
                        );
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${
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
                className="px-3 py-1 rounded-lg bg-[#182923] hover:bg-[#233b32] border border-[#3a5e51] text-[#e6f5ee] text-xs font-extrabold"
              >
                CLOSE [Q]
              </button>
            </div>

            {/* TAB 1: GEAR & VAULT (Live Mini-Surveyor Paperdoll + 7 Slots on Left; 8x8 Grid + Bottom Page Bar on Right) */}
            {armoryTab === "vault" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
                {/* Left Column: Live Mini-Surveyor + Current Floor + 7 Slots */}
                <div className="md:col-span-5 bg-[#0b1411] border border-[#1f362e] rounded-lg p-2 flex flex-col justify-between gap-1.5 overflow-hidden">
                  <div className="flex items-center gap-2.5 bg-[#080e0c] border border-[#1a2e27] rounded-lg p-1.5">
                    <SurveyorPaperdollCanvas
                      skinId={runState.profile.activeSkin}
                      equipped={runState.profile.equippedGear}
                      width={78}
                      height={78}
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#6fe3c1]">
                          FLOOR {String(floorNum).padStart(2, "0")} · LV.{runState.player.level}
                        </span>
                        <span className="text-[10px] font-bold text-[#ffcf4d]">
                          ATK {computedStats.totalAttack} · HP {computedStats.maxHealth}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const nextRun = equipBestGearFromBank(runState);
                            updateProfile(nextRun.profile);
                            updateProfile(nextRun.profile);
                            deepSignalAudio.playUiChime("upgrade");
                            showToast("EQUIPPED BEST GEAR");
                          }}
                          className="flex-1 py-1 rounded bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-[10px] font-black"
                        >
                          ★ EQUIP BEST
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextRun = unequipAllSlotsToBank(runState);
                            updateProfile(nextRun.profile);
                            deepSignalAudio.playUiChime("shop");
                            showToast("UNEQUIPPED ALL");
                          }}
                          className="flex-1 py-1 rounded bg-[#182923] hover:bg-[#233b32] border border-[#36594d] text-[#bfe3d5] text-[10px] font-extrabold"
                        >
                          UNEQUIP ALL
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold text-[#ffcf4d]">UPGRADE:</span>
                        <div className="flex items-center gap-0.5">
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
                    </div>
                  </div>

                  {/* All 7 Equipped Slots (Compact so all 7 fit with ZERO scrolling) */}
                  <div className="flex flex-col gap-1 flex-1 justify-between">
                    {ALL_GEAR_SLOTS.map((slot) => {
                      const item = runState.profile.equippedGear[slot];
                      const slotLv = runState.profile.slotUpgradeLevels[slot] ?? 1;
                      const plan = getMultiSlotUpgradePlan(
                        slotLv,
                        runState.profile.gold + runState.carriedGold,
                        upgradeQty === "MAX" ? "max" : upgradeQty,
                      );
                      const canUpgrade = slotLv < MAX_SLOT_UPGRADE_LEVEL && plan.levelsGained > 0;
                      const eff = item ? getEffectiveGearStats(item, slotLv) : null;

                      return (
                        <div
                          key={slot}
                          className={`px-2 py-1 rounded border flex items-center justify-between gap-1.5 ${
                            item
                              ? `${RARITY_STYLES[item.rarity].border} ${RARITY_STYLES[item.rarity].bg}`
                              : "border-[#1d302a] bg-[#080e0c]"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item ? (
                              <PixelGearIcon slot={slot} rarity={item.rarity} weaponType={item.weaponType} size={20} />
                            ) : (
                              <div className="w-5 h-5 rounded bg-[#101c18] border border-[#223830] flex items-center justify-center text-[8px] text-[#557066]">
                                —
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] font-extrabold truncate flex items-center gap-1">
                                <span className="text-[#7ca394]">{SLOT_LABELS[slot]}</span>
                                <span className="text-[#ffcf4d]">LV.{slotLv}</span>
                                {item ? (
                                  <span className={RARITY_STYLES[item.rarity].text}>
                                    · {item.name} {item.ascensionRank > 0 ? `★${item.ascensionRank}` : ""}
                                  </span>
                                ) : (
                                  <span className="text-[#557066]">· Empty</span>
                                )}
                              </div>
                              {eff && (
                                <div className="text-[9px] text-[#9bc4b4] leading-none">
                                  {eff.attack > 0 ? `+${eff.attack} ATK ` : ""}
                                  {eff.health > 0 ? `+${eff.health} HP ` : ""}
                                  {eff.guard > 0 ? `+${eff.guard} STA ` : ""}
                                  {eff.agility > 0 ? `+${eff.agility} SPD` : ""}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={!canUpgrade}
                              onClick={() => {
                                const nextRun = upgradeEquippedSlotBulkWithGold(
                                  runState,
                                  slot,
                                  upgradeQty === "MAX" ? "max" : upgradeQty,
                                );
                                if (nextRun !== runState) {
                                  updateProfile(nextRun.profile);
                                  deepSignalAudio.playUiChime("upgrade");
                                  showToast(`${SLOT_LABELS[slot]} +${plan.levelsGained} LV (-${plan.totalCost}G)`);
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                canUpgrade
                                  ? "bg-[#ffcf4d] hover:bg-[#ffe082] text-[#171203]"
                                  : "bg-[#1a241e] text-[#5c6e64]"
                              }`}
                            >
                              {slotLv >= MAX_SLOT_UPGRADE_LEVEL
                                ? "MAX"
                                : plan.levelsGained > 0
                                  ? `+${plan.levelsGained} (${plan.totalCost}G)`
                                  : "LOW G"}
                            </button>
                            {item && (
                              <button
                                type="button"
                                onClick={() => updateProfile(unequipSlotToBank(runState.profile, slot))}
                                className="px-1.5 py-0.5 rounded bg-[#15241f] border border-[#2b473d] text-[9px] text-[#9bc4b4]"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Filter Bar + Zero-Scroll 8x8 Vault Grid + Bottom Page Bar */}
                <div className="md:col-span-7 bg-[#0b1411] border border-[#1f362e] rounded-lg p-2 flex flex-col justify-between gap-1.5 overflow-hidden">
                  {/* Top Rarity Filter & Bulk Sell */}
                  <div className="flex flex-wrap items-center justify-between gap-1 bg-[#080e0c] border border-[#1a2e27] rounded px-2 py-1 shrink-0">
                    <div className="flex items-center gap-1">
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
                          {rar === "all" ? "ALL" : rar.slice(0, 4).toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextRun = sellFilteredBankItems(
                          runState,
                          vaultSellRarity === "all" ? "ALL" : vaultSellRarity,
                        );
                        if (nextRun !== runState) {
                          updateProfile(nextRun.profile);
                          deepSignalAudio.playUiChime("sell");
                          showToast(`SOLD FILTERED (+${nextRun.profile.gold - runState.profile.gold}G)`);
                        } else {
                          showToast("NO ITEMS MATCH FILTER");
                        }
                      }}
                    className="px-2 py-0.5 rounded bg-[#361614] hover:bg-[#4a1e1b] border border-[#9c362f] text-[#ff9b94] text-[9px] font-black"
                  >
                    SELL {vaultSellRarity === "all" ? "ALL" : vaultSellRarity.toUpperCase()}
                  </button>
                </div>

                {/* 8x8 Vault Grid (Proportioned height so all 64 slots fit with ZERO scrolling) */}
                <div className="grid grid-cols-8 gap-1 flex-1 min-h-0">
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
                        className={`h-8 rounded border relative flex items-center justify-center transition ${
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
                              size={20}
                            />
                            {item.ascensionRank > 0 && (
                              <span className="absolute top-0 left-0.5 text-[#eabfff] text-[8px] font-black leading-none">
                                ★{item.ascensionRank}
                              </span>
                            )}
                            {canFuseStack && (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#d18ce8]" />
                            )}
                            <span className="absolute bottom-0 right-0.5 text-[8px] font-black text-[#ffffff] leading-none">
                              x{item.count}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Item Action Bar */}
                {selectedVaultItem ? (
                  <div
                    className={`px-2 py-1.5 rounded border flex flex-wrap items-center justify-between gap-1.5 shrink-0 ${
                      RARITY_STYLES[selectedVaultItem.rarity].border
                    } ${RARITY_STYLES[selectedVaultItem.rarity].bg}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PixelGearIcon
                        slot={selectedVaultItem.slot}
                        rarity={selectedVaultItem.rarity}
                        weaponType={selectedVaultItem.weaponType}
                        size={24}
                      />
                      <div className="min-w-0">
                        <div className={`text-[11px] font-black truncate ${RARITY_STYLES[selectedVaultItem.rarity].text}`}>
                          {selectedVaultItem.name}{" "}
                          {selectedVaultItem.ascensionRank > 0 ? `(★${selectedVaultItem.ascensionRank})` : ""} · x
                          {selectedVaultItem.count}
                        </div>
                        <div className="text-[9px] text-[#b8d8cc]">
                          {SLOT_LABELS[selectedVaultItem.slot]} · Sell: {getGearSellValue(selectedVaultItem)}G
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          updateProfile(equipFromBankToSlot(runState.profile, selectedVaultItem.id));
                          deepSignalAudio.playPickup("gear");
                          showToast(`EQUIPPED ${selectedVaultItem.name.toUpperCase()}`);
                        }}
                        className="px-2 py-1 rounded bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-[9px] font-black"
                      >
                        EQUIP
                      </button>

                      {selectedVaultItem.count >= ASCENSION_MERGE_COUNT && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextRun = fuseGearStackInVault(runState, selectedVaultItem.id);
                            if (nextRun.lastAscensionResult) {
                              updateProfile(nextRun.profile);
                              deepSignalAudio.playUiChime("ascend");
                              showToast(`FUSED -> ★${nextRun.lastAscensionResult.newRank}!`);
                            }
                          }}
                          className="px-2 py-1 rounded bg-[#d18ce8] text-[#17071f] text-[9px] font-black"
                        >
                          ✦ FUSE 3
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const nextRun = sellBankItemStack(runState, selectedVaultItem.id, 1);
                          const goldEarned = nextRun.profile.gold - runState.profile.gold;
                          if (goldEarned > 0) {
                            updateProfile(nextRun.profile);
                            deepSignalAudio.playUiChime("sell");
                            showToast(`+${goldEarned}G`);
                          }
                        }}
                        className="px-2 py-1 rounded bg-[#2b220d] border border-[#8f6d1d] text-[#ffcf4d] text-[9px] font-extrabold"
                      >
                        SELL 1
                      </button>

                      {selectedVaultItem.count > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextRun = sellBankItemStack(runState, selectedVaultItem.id, selectedVaultItem.count);
                            const goldEarned = nextRun.profile.gold - runState.profile.gold;
                            if (goldEarned > 0) {
                              updateProfile(nextRun.profile);
                              deepSignalAudio.playUiChime("sell");
                              showToast(`+${goldEarned}G`);
                            }
                          }}
                          className="px-2 py-1 rounded bg-[#361614] border border-[#9c362f] text-[#ff9b94] text-[9px] font-extrabold"
                        >
                          SELL ALL
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-1.5 rounded border border-[#1a2e27] bg-[#080e0c] text-[10px] text-[#6d8f82] shrink-0">
                    Click any stack in your Vault to Equip, Fuse (3 → ★), or Sell.
                  </div>
                )}

                {/* Bottom Vault Page Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1a2e27] shrink-0">
                  <span className="text-[10px] font-bold text-[#8fb5a6]">
                    VAULT STACKS: {runState.profile.bankedGear.length}/{VAULT_PAGE_SIZE * VAULT_TOTAL_PAGES}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setVaultPage((p) => Math.max(0, p - 1))}
                      disabled={vaultPage === 0}
                      className="px-2 py-0.5 rounded bg-[#101c18] border border-[#253f36] text-[10px] font-black text-[#9bc4b4] disabled:opacity-40"
                    >
                      ◀
                    </button>
                    {Array.from({ length: VAULT_TOTAL_PAGES }).map((_, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setVaultPage(pIdx)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${
                          vaultPage === pIdx
                            ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                            : "bg-[#0e1a16] text-[#8fb5a6] border-[#253f36]"
                        }`}
                      >
                        PAGE {pIdx + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVaultPage((p) => Math.min(VAULT_TOTAL_PAGES - 1, p + 1))}
                      disabled={vaultPage === VAULT_TOTAL_PAGES - 1}
                      className="px-2 py-0.5 rounded bg-[#101c18] border border-[#253f36] text-[10px] font-black text-[#9bc4b4] disabled:opacity-40"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FUSION (3 -> 9 -> 27) */}
          {armoryTab === "fusion" && (
            <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden">
              <div className="p-2 rounded-lg bg-[#170f21] border border-[#4a2b6b] shrink-0">
                <div className="text-xs font-black text-[#eabfff]">
                  ✦ EXPONENTIAL ASCENSION FORGE (3 → 9 → 27 → 81...)
                </div>
                <div className="text-[11px] text-[#c7a9de]">
                  Merge <strong>3 identical rank copies</strong> into <strong>1 higher-star item</strong> (+28% multiplicative power per star).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-hidden">
                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-1.5 overflow-hidden">
                  <div className="text-xs font-extrabold text-[#6fe3c1]">
                    EQUIPPED GEAR (FUSE WITH 2 VAULT COPIES)
                  </div>
                  <div className="flex flex-col gap-1.5">
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
                          className={`px-2 py-1.5 rounded border flex items-center justify-between gap-2 ${
                            RARITY_STYLES[eq.rarity].border
                          } ${RARITY_STYLES[eq.rarity].bg}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PixelGearIcon slot={eq.slot} rarity={eq.rarity} weaponType={eq.weaponType} size={22} />
                            <div className="min-w-0">
                              <div className={`text-xs font-extrabold truncate ${RARITY_STYLES[eq.rarity].text}`}>
                                {eq.name} ★{eq.ascensionRank}
                              </div>
                              <div className="text-[9px] text-[#9bc4b4]">
                                Copies: {1 + vaultMatches}/{ASCENSION_MERGE_COUNT} ({getBaseCopiesEquivalent(eq.ascensionRank)}x base)
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canFuseEq}
                            onClick={() => {
                              const nextRun = fuseEquippedWithVaultCopies(runState, slot);
                              if (nextRun.lastAscensionResult) {
                                updateProfile(nextRun.profile);
                                deepSignalAudio.playUiChime("ascend");
                                showToast(
                                  `ASCENDED ${nextRun.lastAscensionResult.itemName.toUpperCase()} -> ★${nextRun.lastAscensionResult.newRank}!`,
                                );
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

                <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col gap-1.5 overflow-hidden">
                  <div className="text-xs font-extrabold text-[#6fe3c1]">
                    READY VAULT STACKS (3+ IDENTICAL COPIES)
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {runState.profile.bankedGear
                      .filter((g) => g.count >= ASCENSION_MERGE_COUNT)
                      .slice(0, 7)
                      .map((g) => (
                        <div
                          key={g.id}
                          className={`px-2 py-1.5 rounded border flex items-center justify-between gap-2 ${
                            RARITY_STYLES[g.rarity].border
                          } ${RARITY_STYLES[g.rarity].bg}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <PixelGearIcon slot={g.slot} rarity={g.rarity} weaponType={g.weaponType} size={22} />
                            <div className="min-w-0">
                              <div className={`text-xs font-extrabold truncate ${RARITY_STYLES[g.rarity].text}`}>
                                {g.name} ★{g.ascensionRank}
                              </div>
                              <div className="text-[9px] text-[#b8d8cc]">
                                Stack: x{g.count} · Base: {getBaseCopiesEquivalent(g.ascensionRank)}x
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextRun = fuseGearStackInVault(runState, g.id);
                              if (nextRun.lastAscensionResult) {
                                updateProfile(nextRun.profile);
                                deepSignalAudio.playUiChime("ascend");
                                showToast(
                                  `MERGED 3x -> ${nextRun.lastAscensionResult.itemName.toUpperCase()} ★${nextRun.lastAscensionResult.newRank}!`,
                                );
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#d18ce8] hover:bg-[#e5aef7] text-[#17071f] text-[10px] font-black shrink-0"
                          >
                            3 → ★{g.ascensionRank + 1}
                          </button>
                        </div>
                      ))}
                    {runState.profile.bankedGear.filter((g) => g.count >= ASCENSION_MERGE_COUNT).length === 0 && (
                      <div className="p-3 rounded bg-[#080e0c] border border-[#1a2e27] text-[11px] text-[#6d8f82]">
                        Collect 3 copies of any gear piece to fuse it into a higher star rank!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNIFIED 5-BOOKMARK FIELD BOOK (1. MAP, 2. INDEX, 3. SUITS, 4. ENEMIES, 5. BOSSES) */}
          {armoryTab === "book" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
              {/* Left Spine: Live Mini-Surveyor Paperdoll + Context Career Telemetry */}
              <div className="md:col-span-4 bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col justify-between gap-2 overflow-hidden">
                <div className="flex flex-col items-center text-center gap-1.5 bg-[#080e0c] border border-[#1a2e27] rounded-lg p-2">
                  <div className="text-[10px] font-black tracking-widest text-[#6fe3c1]">
                    SURVEYOR DOSSIER · LV.{runState.player.level}
                  </div>
                  <SurveyorPaperdollCanvas
                    skinId={bookChapter === "suits" ? previewSuitId : runState.profile.activeSkin}
                    equipped={runState.profile.equippedGear}
                    previewItem={bookChapter === "index" ? selectedIndexPreviewGear : null}
                    width={116}
                    height={116}
                  />
                  <div className="text-[10px] text-[#9bc4b4]">
                    {bookChapter === "index"
                      ? `HOLDING: ${selectedIndexBlueprint.name.toUpperCase()}`
                      : `SUIT: ${SURVEYOR_SKINS.find((s) => s.id === (bookChapter === "suits" ? previewSuitId : runState.profile.activeSkin))?.name ?? "STANDARD"}`}
                  </div>
                </div>

                {/* Context-Sensitive Stats on Left Page */}
                <div className="bg-[#080e0c] border border-[#1a2e27] rounded-lg p-2 flex flex-col gap-1 text-[10px] flex-1 justify-center">
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">TIME PLAYED:</span>
                    <span className="font-bold text-[#e6f5ee]">{formattedPlayTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">DEEPEST FLOOR:</span>
                    <span className="font-bold text-[#6fe3c1]">F{String(runState.profile.deepestFloor).padStart(2, "0")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">TOTAL GOLD GAINED:</span>
                    <span className="font-bold text-[#ffcf4d]">{runState.profile.totalGoldEarned.toLocaleString()}G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">TOTAL GEMS GAINED:</span>
                    <span className="font-bold text-[#5ec8ff]">{runState.profile.totalDiamondsEarned.toLocaleString()} ◆</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">HUSKS / BOSSES SLAIN:</span>
                    <span className="font-bold text-[#ff8a80]">
                      {Object.values(runState.profile.enemyRecords).reduce((a, b) => a + b.kills, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7ca394]">ITEMS FOUND / MERGED:</span>
                    <span className="font-bold text-[#d4a8ff]">
                      {runState.profile.totalItemsFound} / {runState.profile.totalItemsMerged}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Pages + 5 Chapter Bookmarks (1. MAP, 2. INDEX, 3. SUITS, 4. ENEMIES, 5. BOSSES) */}
              <div className="md:col-span-8 flex flex-col gap-2 min-h-0 overflow-hidden">
                {/* 5 Colored Chapter Bookmarks */}
                <div className="grid grid-cols-5 gap-1 shrink-0">
                  {(
                    [
                      { id: "map", label: "1. MAP" },
                      { id: "index", label: "2. INDEX" },
                      { id: "suits", label: "3. SUITS" },
                      { id: "enemies", label: "4. ENEMIES" },
                      { id: "bosses", label: "5. BOSSES" },
                    ] as const
                  ).map((bm) => (
                    <button
                      key={bm.id}
                      type="button"
                      onClick={() => setBookChapter(bm.id)}
                      className={`py-1.5 rounded-t-lg text-[10px] font-black border-b-2 transition ${
                        bookChapter === bm.id
                          ? "bg-[#142922] text-[#6fe3c1] border-[#6fe3c1]"
                          : "bg-[#0a120f] text-[#7ca394] border-[#1f362e] hover:text-[#cfe8de]"
                      }`}
                    >
                      {bm.label}
                    </button>
                  ))}
                </div>

                {/* CHAPTER 1: COMPLEX MAP (Sectors 0–11 + Deploy / Continue Sector Button) */}
                {bookChapter === "map" && (
                  <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col justify-between gap-2 flex-1 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-[#6fe3c1]">
                          BTC SUBTERRANEAN COMPLEX SCHEMATIC (SECTORS 0–11)
                        </div>
                        <div className="text-[10px] text-[#9bc4b4]">
                          Defeat each Sector Guardian (F10, F20, ..., F100) to permanently link the next floor!
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deepSignalAudio.playUiChime("extract");
                          setRunState((prev) => startDeepSignalRun(prev, selectedStartFloor));
                          setShowArmory(false);
                          showToast(`DEPLOYING TO FLOOR ${String(selectedStartFloor).padStart(2, "0")}`);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e] text-[11px] font-black shrink-0 shadow"
                      >
                        ▶ DEPLOY SECTOR (F{String(selectedStartFloor).padStart(2, "0")})
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 flex-1">
                      {BIOMES.map((b) => {
                        const deployTarget = b.minFloor === 0 ? 1 : b.minFloor;
                        const unlocked = b.minFloor <= 1 || runState.profile.unlockedSignalLinks.includes(deployTarget);
                        const isSelected =
                          (b.minFloor === 0 && selectedStartFloor === 1 && !runState.profile.introWatched) ||
                          (selectedStartFloor >= Math.max(1, b.minFloor) && selectedStartFloor <= b.maxFloor);

                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={!unlocked && b.minFloor > 0}
                            onClick={() => {
                              if (b.minFloor === 0) {
                                setSelectedStartFloor(1);
                                setRunState((prev) => ({
                                  ...prev,
                                  profile: { ...prev.profile, introWatched: false },
                                }));
                                showToast("TRAINING YARD SELECTED");
                              } else if (unlocked) {
                                setSelectedStartFloor(deployTarget);
                              }
                            }}
                            className={`p-2 rounded border text-left flex flex-col justify-between transition ${
                              isSelected
                                ? "border-[#6fe3c1] bg-[#132922]"
                                : unlocked || b.minFloor === 0
                                  ? "border-[#253f36] bg-[#080e0c] hover:bg-[#101c18]"
                                  : "border-[#16241f] bg-[#070b0a] opacity-45"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-[#e6f5ee] truncate">
                                S{b.sectorNumber}: {b.name}
                              </span>
                              <span
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: b.accentColor }}
                              />
                            </div>
                            <div className="text-[9px] font-bold text-[#ffcf4d]">
                              {b.floorRangeLabel}
                            </div>
                            <div className="text-[9px] text-[#8fb5a6] truncate">
                              {unlocked || b.minFloor === 0 ? b.ambientNote : `🔒 Defeat F${b.minFloor - 1} Boss`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CHAPTER 2: ITEM INDEX (Compact 15x7 Matrix + Live Item-In-Hand Preview & Stats) */}
                {bookChapter === "index" && (
                  <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2 flex flex-col justify-between gap-1.5 flex-1 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 shrink-0">
                      <span className="text-[10px] font-black text-[#6fe3c1]">
                        CATALOG ({runState.profile.discoveredItems.length}/{FULL_ITEM_CATALOG.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(["all", ...ALL_GEAR_SLOTS] as const).map((slotKey) => (
                          <button
                            key={slotKey}
                            type="button"
                            onClick={() => setIndexSlotFilter(slotKey)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                              indexSlotFilter === slotKey
                                ? "bg-[#6fe3c1] text-[#06120e] border-[#6fe3c1]"
                                : "bg-[#0e1a16] text-[#9bc4b4] border-[#253f36]"
                            }`}
                            >
                              {slotKey === "all" ? "ALL" : SLOT_LABELS[slotKey]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Compact Zero-Scroll 15-Column Icon Matrix */}
                      <div className="grid grid-cols-15 gap-0.5 flex-1 min-h-0 content-start" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
                        {filteredCatalog.map((bp) => {
                          const discovered = runState.profile.discoveredItems.includes(bp.baseKey);
                          const isSelected = bp.baseKey === selectedIndexBaseKey;
                          return (
                            <button
                              key={bp.baseKey}
                              type="button"
                              onClick={() => setSelectedIndexBaseKey(bp.baseKey)}
                              className={`h-7 rounded border flex items-center justify-center ${
                                isSelected ? "ring-2 ring-[#ffffff]" : ""
                              } ${
                                discovered
                                  ? `${RARITY_STYLES[bp.rarity].border} ${RARITY_STYLES[bp.rarity].bg}`
                                  : "border-[#182923] bg-[#080e0c] opacity-55"
                              }`}
                            >
                              <div className={discovered ? "" : "brightness-0 invert opacity-25"}>
                                <PixelGearIcon slot={bp.slot} rarity={bp.rarity} weaponType={bp.weaponType} size={16} />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Item Stats, Found Count & Kills With Item */}
                      {(() => {
                        const discovered = runState.profile.discoveredItems.includes(selectedIndexBlueprint.baseKey);
                        const foundTimes = runState.profile.itemFoundCount[selectedIndexBlueprint.baseKey] ?? 0;
                        const killsWithItem = runState.profile.itemKillsCount[selectedIndexBlueprint.baseKey] ?? 0;
                        return (
                          <div className="p-2 rounded bg-[#080e0c] border border-[#1f362e] flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={discovered ? "" : "brightness-0 invert opacity-30"}>
                                <PixelGearIcon
                                  slot={selectedIndexBlueprint.slot}
                                  rarity={selectedIndexBlueprint.rarity}
                                  weaponType={selectedIndexBlueprint.weaponType}
                                  size={28}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className={`text-xs font-black truncate ${discovered ? RARITY_STYLES[selectedIndexBlueprint.rarity].text : "text-[#6d8f82]"}`}>
                                  {discovered ? selectedIndexBlueprint.name : "??? UNDISCOVERED RELIC"}
                                </div>
                                <div className="text-[10px] text-[#9bc4b4]">
                                  {selectedIndexBlueprint.rarity.toUpperCase()} {SLOT_LABELS[selectedIndexBlueprint.slot]} ·{" "}
                                  {selectedIndexPreviewGear.attackBonus > 0 ? `+${selectedIndexPreviewGear.attackBonus} ATK ` : ""}
                                  {selectedIndexPreviewGear.healthBonus > 0 ? `+${selectedIndexPreviewGear.healthBonus} HP ` : ""}
                                  {selectedIndexPreviewGear.guardBonus > 0 ? `+${selectedIndexPreviewGear.guardBonus} STA ` : ""}
                                  {selectedIndexPreviewGear.agilityBonus > 0 ? `+${selectedIndexPreviewGear.agilityBonus} SPD` : ""}
                                </div>
                              </div>
                            </div>

                            <div className="text-right text-[10px] shrink-0">
                              <div className="text-[#ffcf4d] font-bold">FOUND: {foundTimes}x</div>
                              <div className="text-[#ff8a80] font-bold">SLAIN WITH IT: {killsWithItem}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* CHAPTER 3: 10 MILESTONE SUITS (Unlocked Every 10 Floors + History & Tiny Buffs) */}
                  {bookChapter === "suits" && (
                    <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col justify-between gap-2 flex-1 min-h-0 overflow-hidden">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {SURVEYOR_SKINS.map((sk) => {
                          const unlocked =
                            runState.profile.unlockedSkins.includes(sk.id) ||
                            runState.profile.deepestFloor >= sk.unlockFloor;
                          const active = runState.profile.activeSkin === sk.id;
                          const selected = previewSuitId === sk.id;
                          return (
                            <button
                              key={sk.id}
                              type="button"
                              onClick={() => setPreviewSuitId(sk.id)}
                              className={`p-1.5 rounded border text-left flex flex-col justify-between ${
                                selected
                                  ? "border-[#ffcf56] bg-[#1c1a0e]"
                                  : active
                                    ? "border-[#6fe3c1] bg-[#132922]"
                                    : unlocked
                                      ? "border-[#253f36] bg-[#080e0c]"
                                      : "border-[#16241f] bg-[#070b0a] opacity-55"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className="w-3 h-3 rounded-sm border border-black"
                                  style={{ backgroundColor: sk.body }}
                                />
                                <span className="text-[9px] font-black text-[#ffcf4d]">F{sk.unlockFloor}</span>
                              </div>
                              <div className="text-[9px] font-extrabold text-[#e6f5ee] truncate mt-1">
                                {sk.name}
                              </div>
                              <div className="text-[8px] text-[#6fe3c1] truncate">{sk.buffLabel}</div>
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const suit = SURVEYOR_SKINS.find((s) => s.id === previewSuitId) ?? SURVEYOR_SKINS[0]!;
                        const unlocked =
                          runState.profile.unlockedSkins.includes(suit.id) ||
                          runState.profile.deepestFloor >= suit.unlockFloor;
                        const active = runState.profile.activeSkin === suit.id;
                        return (
                          <div className="p-2.5 rounded bg-[#080e0c] border border-[#1f362e] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-black text-[#ffdf6b]">
                                {suit.name} · <span className="text-[#6fe3c1]">{suit.buffLabel}</span>
                              </div>
                              <div className="text-[10px] text-[#a5ccc0] mt-0.5 leading-snug">
                                {suit.history}
                              </div>
                              <div className="text-[9px] text-[#7ca394] mt-1">
                                UNLOCK CONDITION: {suit.unlockNote}
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!unlocked || active}
                              onClick={() => {
                                updateProfile(setSurveyorSkin(runState.profile, suit.id));
                                deepSignalAudio.playUiChime("upgrade");
                                showToast(`EQUIPPED ${suit.name}`);
                              }}
                              className={`px-3.5 py-2 rounded-lg text-[10px] font-black shrink-0 ${
                                active
                                  ? "bg-[#19382e] text-[#6fe3c1] border border-[#6fe3c1]"
                                  : unlocked
                                    ? "bg-[#6fe3c1] hover:bg-[#8cf2d4] text-[#06120e]"
                                    : "bg-[#141f1c] text-[#5c736b]"
                              }`}
                            >
                              {active ? "EQUIPPED" : unlocked ? "EQUIP SUIT" : "LOCKED"}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* CHAPTER 4: ENEMIES (All 6 Husk Classes + Kills, Deaths To & Loot Recovered) */}
                  {bookChapter === "enemies" && (
                    <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col justify-between gap-2 flex-1 min-h-0 overflow-hidden">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                        {(["stalker", "brute", "archer", "phaser", "flyer", "bandit"] as const).map((eid) => {
                          const entry = ENEMY_LORE_CODEX[eid];
                          const selected = selectedEnemyCodexId === eid;
                          return (
                            <button
                              key={eid}
                              type="button"
                              onClick={() => setSelectedEnemyCodexId(eid)}
                              className={`py-1.5 px-1 rounded border text-[9px] font-black truncate ${
                                selected
                                  ? "border-[#6fe3c1] bg-[#132922] text-[#6fe3c1]"
                                  : "border-[#253f36] bg-[#080e0c] text-[#9bc4b4]"
                              }`}
                            >
                              {entry.title.replace("Husk ", "").replace("Mutant ", "")}
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const entry = ENEMY_LORE_CODEX[selectedEnemyCodexId];
                        const rec = runState.profile.enemyRecords[selectedEnemyCodexId] ?? {
                          kills: 0,
                          deathsTo: 0,
                          goldDropped: 0,
                          gemsDropped: 0,
                        };
                        return (
                          <div className="p-3 rounded bg-[#080e0c] border border-[#1f362e] flex flex-col sm:flex-row items-center gap-3 flex-1">
                            <EnemyMiniPreviewCanvas enemyKind={selectedEnemyCodexId} />
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="text-sm font-black text-[#e6f5ee]">{entry.title}</div>
                              <div className="text-[10px] font-bold text-[#6fe3c1]">
                                ABILITY: {entry.abilityName} · WEAPON: {entry.weapon}
                              </div>
                              <p className="text-[11px] text-[#a5ccc0] leading-snug">{entry.lore}</p>
                              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px]">
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">SLAIN</div>
                                  <div className="font-black text-[#6fe3c1]">{rec.kills}</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">DEATHS TO</div>
                                  <div className="font-black text-[#ff786b]">{rec.deathsTo}</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">GOLD LOOT</div>
                                  <div className="font-black text-[#ffcf4d]">{rec.goldDropped}G</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">GEMS / TIER</div>
                                  <div className="font-black text-[#5ec8ff]">
                                    {rec.gemsDropped}◆ {rec.bestRarity ? `(${rec.bestRarity.slice(0, 3)})` : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* CHAPTER 5: BOSSES (F10–F100 Guardians + Kills, Deaths To, Loot & Signal Tapes) */}
                  {bookChapter === "bosses" && (
                    <div className="bg-[#0b1411] border border-[#1f362e] rounded-lg p-2.5 flex flex-col justify-between gap-2 flex-1 min-h-0 overflow-hidden">
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                        {SIGNAL_TAPES_DB.map((t) => {
                          const selected = selectedBossFloor === t.floorFound;
                          const unlocked =
                            runState.profile.decodedTapes.includes(t.id) ||
                            runState.profile.unlockedSignalLinks.includes(t.floorFound + 1);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setSelectedBossFloor(t.floorFound)}
                              className={`py-1 rounded border text-[9px] font-black ${
                                selected
                                  ? "border-[#ffcf56] bg-[#241e0d] text-[#ffdf6b]"
                                  : unlocked
                                    ? "border-[#2b4a3f] bg-[#0e1a16] text-[#9bc4b4]"
                                    : "border-[#16241f] bg-[#070b0a] text-[#4e695f]"
                              }`}
                            >
                              F{t.floorFound}
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const bossSpec = getBossSpecForFloor(selectedBossFloor);
                        const tape = SIGNAL_TAPES_DB.find((t) => t.floorFound === selectedBossFloor);
                        const rec = runState.profile.enemyRecords[`boss-${selectedBossFloor}`] ?? {
                          kills: 0,
                          deathsTo: 0,
                          goldDropped: 0,
                          gemsDropped: 0,
                        };
                        const unlocked =
                          rec.kills > 0 ||
                          (tape && runState.profile.decodedTapes.includes(tape.id)) ||
                          runState.profile.unlockedSignalLinks.includes(selectedBossFloor + 1);

                        return (
                          <div className="p-3 rounded bg-[#080e0c] border border-[#1f362e] flex flex-col sm:flex-row items-center gap-3 flex-1">
                            <BossMiniPreviewCanvas bossSpec={bossSpec} />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="text-sm font-black text-[#ffdf6b]">
                                {bossSpec.name} <span className="text-[10px] text-[#6fe3c1]">(FLOOR {selectedBossFloor})</span>
                              </div>
                              <div className="text-[10px] font-bold text-[#9bc4b4]">
                                {bossSpec.title} · {bossSpec.abilityLabel}
                              </div>
                              <p className="text-[10px] text-[#a5ccc0] leading-snug">
                                {unlocked && tape
                                  ? `“${tape.transcript}”`
                                  : "Defeat this Sector Guardian to decode its Signal Tape transmission."}
                              </p>
                              <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px]">
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">VICTORIES</div>
                                  <div className="font-black text-[#6fe3c1]">{rec.kills}</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">DEATHS TO</div>
                                  <div className="font-black text-[#ff786b]">{rec.deathsTo}</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">GOLD LOOT</div>
                                  <div className="font-black text-[#ffcf4d]">{rec.goldDropped}G</div>
                                </div>
                                <div className="p-1.5 rounded bg-[#0d1714] border border-[#1f362e]">
                                  <div className="text-[#7ca394] text-[8px]">GEMS / TIER</div>
                                  <div className="font-black text-[#5ec8ff]">
                                    {rec.gemsDropped}◆ {rec.bestRarity ? `(${rec.bestRarity.slice(0, 3)})` : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
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


