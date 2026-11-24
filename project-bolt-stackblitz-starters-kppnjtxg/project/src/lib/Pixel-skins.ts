import type {
  BiomeDefinition,
  BossSpec,
  BreakableProp,
  Enemy,
  GearItem,
  GearRarity,
  GearSlot,
  RoomBlocker,
  WeaponArchetype,
} from "./deep-signal-engine";

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
    body: "#f4f8f7",
    bodyShadow: "#cbd6d3",
    visor: "#0a0d0f",
    visorGlow: "rgba(244, 248, 247, 0.35)",
    trim: "#0a0d0f",
  },
  {
    id: "cryo-surveyor",
    name: "CRYO-CONDUIT RIG",
    unlockNote: "Extract from Floor 20+",
    body: "#7ce0ff",
    bodyShadow: "#3589b3",
    visor: "#071724",
    visorGlow: "rgba(99, 210, 255, 0.4)",
    trim: "#0a0d0f",
  },
  {
    id: "void-walker",
    name: "ARCHIVE PHANTOM",
    unlockNote: "Extract from Floor 50+",
    body: "#c7b3ff",
    bodyShadow: "#6d52b8",
    visor: "#130b29",
    visorGlow: "rgba(182, 156, 255, 0.42)",
    trim: "#0a0d0f",
  },
  {
    id: "sovereign-gold",
    name: "SOVEREIGN PRIME",
    unlockNote: "Extract from Floor 100+",
    body: "#ffe07d",
    bodyShadow: "#b5851d",
    visor: "#1c1303",
    visorGlow: "rgba(255, 207, 86, 0.45)",
    trim: "#0a0d0f",
  },
];

export function getSkinTheme(skinId: string): SkinTheme {
  return SURVEYOR_SKINS.find((s) => s.id === skinId) ?? SURVEYOR_SKINS.at(0)!;
}

/**
 * Helper to stamp an ASCII pixel-art matrix onto the canvas at 2x2 pixel scale
 * so every sprite has crisp 1px-equivalent black outlines matching your friend's sheets.
 */
function stampPixelMatrix(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  anchorX: number,
  anchorY: number,
  pxSize = 2,
  flipX = false,
) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const startX = Math.round(anchorX - (w * pxSize) / 2);
  const startY = Math.round(anchorY - h * pxSize);

  for (let r = 0; r < h; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]!;
      if (ch === "." || ch === " ") continue;
      const col = palette[ch];
      if (!col) continue;
      const drawCol = flipX ? w - 1 - c : c;
      ctx.fillStyle = col;
      ctx.fillRect(startX + drawCol * pxSize, startY + r * pxSize, pxSize, pxSize);
    }
  }
}

/* ============================================================================
 * 1. YOUR FRIEND'S EXACT PIXEL MATRICES (FROM PAGES 2–5 OF YOUR DESIGN DOC)
 * ============================================================================ */

// Surveyor (White black-outlined suit with | | vertical visor eyes)
const SURVEYOR_IDLE_MATRIX = [
  "...OOOOOO...",
  "..OFFFFFFO..",
  ".OFFFFFFFFO.",
  ".OFFOFOFFFO.",
  ".OFFOFOFFFO.",
  ".OFFOFOFFFO.",
  ".OFFFFFFFFO.",
  "..OFFFFFFO..",
  "...OOOOOO...",
  "..OFFFFFFO..",
  ".OFFFFFFFFO.",
  ".OFFFFFFFFO.",
  "..OOOOOOOO..",
  "..OFFOOFFO..",
  "..OFFOOFFO..",
  ".OOFFOOFFOO.",
];

const SURVEYOR_WALK_MATRIX = [
  "...OOOOOO...",
  "..OFFFFFFO..",
  ".OFFFFFFFFO.",
  ".OFFOFOFFFO.",
  ".OFFOFOFFFO.",
  ".OFFOFOFFFO.",
  ".OFFFFFFFFO.",
  "..OFFFFFFO..",
  "...OOOOOO...",
  "..OFFFFFFO..",
  ".OFFFFFFFFO.",
  ".OFFFFFFFFO.",
  "..OOOOOOOO..",
  ".OOFF..FFOO.",
  "OOFF....FFOO",
  "OOO......OOO",
];

// Husk Stalker (Crimson trooper with pale pink visor bar)
const STALKER_MATRIX = [
  "...OOOOOO...",
  "..ORRRRRRO..",
  ".ORRRRRRRRO.",
  ".ORPPPPPPPO.",
  ".ORPPPPPPPO.",
  ".ORRRRRRRRO.",
  "..ORRRRRRO..",
  "...OOOOOO...",
  "..ORRRRRRO..",
  ".ORRRRRRRRO.",
  ".ORRRRRRRRO.",
  "..OOOOOOOO..",
  "..ORROORRO..",
  "..ORROORRO..",
  ".OORROORROO.",
];

// Husk Brute (Armored red super-soldier with protruding visor crest & arm cannon)
const BRUTE_MATRIX = [
  "....OOOOOOO...",
  "...ORRRRRRRO..",
  "..ORRRRRRRRRO.",
  ".OPPPPPPPPRRO.",
  ".OPPPPPPPPRRO.",
  "..ORRRRRRRRRO.",
  "...OOOOOOOOO..",
  ".OORRRRRRRRROO",
  "ORRRRRRRRRRRRO",
  "ORRDDDDRRRRRRO",
  "ORRDDDDRRRRRRO",
  ".OORRRRRRRRROO",
  "..OOOOOOOOOO..",
  "...ORR..RRO...",
  "...ORR..RRO...",
  "..OORR..RROO..",
];

// Husk Archer (Lime-green bowman with slotted helmet vents)
const ARCHER_MATRIX = [
  "...OOOOOO...",
  "..OGGGGGGO..",
  ".OGWGGWGGGO.",
  ".OGWGGWGGGO.",
  ".OGGGGGGGGO.",
  ".OGGGGGGGGO.",
  "..OGGGGGGO..",
  "...OOOOOO...",
  "..OGGGGGGO..",
  ".OGGGGGGGGO.",
  ".OGGGGGGGGO.",
  "..OOOOOOOO..",
  "..OGGOOGGO..",
  "..OGGOOGGO..",
  ".OOGGOOGGOO.",
];

// Husk Phaser (Purple trooper with glowing magenta T-visor)
const PHASER_MATRIX = [
  "...OOOOOO...",
  "..OPPPPPPO..",
  ".OPMMMMMMPO.",
  ".OPMMMMMMPO.",
  ".OPPPMPPPPO.",
  ".OPPPMPPPPO.",
  "..OPPPPPPO..",
  "...OOOOOO...",
  "..OPPPPPPO..",
  ".OPPPPPPPPO.",
  ".OPPPPPPPPO.",
  "..OOOOOOOO..",
  "..OPPOOPPO..",
  "..OPPOOPPO..",
  ".OOPPOOPPOO.",
];

// Mutant Flyer (Small cobalt blue bat-winged creature with 4 cyan eye dots)
const FLYER_OPEN_MATRIX = [
  "OO............OO",
  "OBO...OOOO...OBO",
  "OBBO.OBBBBO.OBBO",
  "OBBBOBBBBBBOBBBO",
  ".OBBBBBBBBBBBBO.",
  "..OBBCBBBBCBBO..",
  "..OBBBBBBBBBBO..",
  "...OBBCBBBCBO...",
  "....OBBBBBBO....",
  ".....OOOOOO.....",
];

const FLYER_TUCK_MATRIX = [
  ".....OOOOOO.....",
  "....OBBBBBBO....",
  "...OBBBBBBBBO...",
  "...OBBCBBBCBO...",
  "...OBBBBBBBBO...",
  "..OOBBCBBBCBOO..",
  ".OBBOBBBBBBOOBO.",
  ".OBO.OBBBBO.OBO.",
  ".OO...OOOO...OO.",
];

// Husk Bandit (Golden-yellow crowned imp with + eye in dark visor)
const BANDIT_MATRIX = [
  "..OO..OO..OO..",
  "..OYOOYYOOYO..",
  "..OYYYYYYYYO..",
  ".OYYYYYYYYYYO.",
  ".OYYOOOOOOYYO.",
  ".OYYOOWWOOYYO.",
  ".OYYOWWWWOOYO.",
  ".OYYOOWWOOYYO.",
  ".OYYYYYYYYYYO.",
  "..OOOOOOOOOO..",
  "..OYYYYYYYYO..",
  ".OYYYYYYYYYYO.",
  "..OOOOOOOOOO..",
  "..OYYOOOOYYO..",
  ".OOYYOOOOYYOO.",
];

// Floor 10 Boss: VANCE-01 // IRON WARDEN (Big crimson juggernaut with protruding pink visor & floating gauntlets)
const VANCE01_MATRIX = [
  ".....OOOOOOOO.....",
  "....ORRRRRRRRO....",
  "...ORRRRRRRRRRO...",
  "..OPPPPPPPPPPRRO..",
  "..OPPPPPPPPPPRRO..",
  "...ORRRRRRRRRRO...",
  "....OOOOOOOOOO....",
  "..OORRRRRRRRRROO..",
  ".ORRRRRRRRRRRRRRO.",
  "ORRRDDDDDDDDDDRRRO",
  "ORRRDDDDDDDDDDRRRO",
  "ORRRRRRRRRRRRRRRRO",
  ".OORRRRRRRRRRRROO.",
  "...OOOOOOOOOOOO...",
  "....ORROOOORRO....",
  "....ORROOOORRO....",
  "...OORROOOORROO...",
];

// Floor 20 Boss: E1-IJ-4H // RIOT ARCHITECT (Big green slotted-visor riot scientist)
const E1IJ4H_MATRIX = [
  ".....OOOOOOOO.....",
  "....OGGGGGGGGO....",
  "...OGWGGWGGWGGO...",
  "...OGWGGWGGWGGO...",
  "...OGGGGGGGGGGO...",
  "....OOOOOOOOOO....",
  "..OOGGGGGGGGGGOO..",
  ".OGGGGGGGGGGGGGGO.",
  "OGGGDDDDDDDDDDGGGO",
  "OGGGDDDDDDDDDDGGGO",
  "OGGGGGGGGGGGGGGGGO",
  ".OOGGGGGGGGGGGGOO.",
  "...OOOOOOOOOOOO...",
  "....OGGOOOOGGO....",
  "....OGGOOOOGGO....",
  "...OOGGOOOOGGOO...",
];

// Floor 30 Boss: FLYER MATRIARCH (Overgrown 5-eyed cobalt winged matriarch with spiked crown & 3 talons)
const MATRIARCH_MATRIX = [
  "........OO..OO..OO........",
  ".......OBBOOBBOOBBO.......",
  "OO.....OBBBBBBBBBBO.....OO",
  "OBO...OBBBBBBBBBBBBO...OBO",
  "OBBO..OBBBDDBBDDBBBO..OBBO",
  "OBBBO.OBBDDCBBCDDBBO.OBBBO",
  "OBBBBOBBBDBBCCBBDBBBOBBBBO",
  ".OBBBBBBBBDDBBDDBBBBBBBBO.",
  "..OBBBBBBBBBDDBBBBBBBBBO..",
  "...OBBBBBBBBBBBBBBBBBBO...",
  "....OOOOOOOOOOOOOOOOOO....",
  "....OBBO...OBBO...OBBO....",
  ".....OO.....OO.....OO.....",
];

const RARITY_HEX: Record<GearRarity, string> = {
  Common: "#c4d6cf",
  Uncommon: "#6fe3c1",
  Rare: "#63b3ff",
  Epic: "#b87aff",
  Legendary: "#ffcf56",
};

export function drawExactPixelWeapon(
  ctx: CanvasRenderingContext2D,
  weaponType: WeaponArchetype | undefined,
  rarity: GearRarity | undefined,
  swinging: boolean,
) {
  const type = weaponType ?? "Sword";
  ctx.save();
  ctx.rotate(swinging ? -0.7 : 0.12);

  if (type === "Executioner" || rarity === "Legendary") {
    // Golden Greatsword with red core gem (Page 5 far-left weapon)
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(6, -3, 6, 6);
    ctx.fillRect(11, -7, 4, 14);
    ctx.fillRect(14, -4, 18, 8);
    ctx.fillStyle = "#b37412";
    ctx.fillRect(7, -2, 4, 4);
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(12, -6, 2, 12);
    ctx.fillRect(14, -3, 16, 6);
    ctx.fillStyle = "#fff7bd";
    ctx.fillRect(14, -3, 15, 2);
    ctx.fillStyle = "#ff2e2e";
    ctx.fillRect(12, -1, 2, 2);
  } else if (type === "Plasma Cleaver" || rarity === "Epic") {
    // Hot-Magenta Plasma Cleaver with dark purple spine (Page 5 #2/#3 weapon)
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(6, -3, 6, 6);
    ctx.fillRect(11, -6, 19, 11);
    ctx.fillStyle = "#4a1766";
    ctx.fillRect(7, -2, 4, 4);
    ctx.fillRect(12, -1, 16, 4);
    ctx.fillStyle = "#f238ff";
    ctx.fillRect(12, -5, 17, 4);
    ctx.fillStyle = "#ffb8ff";
    ctx.fillRect(13, -5, 15, 2);
  } else if (type === "Broadsword" || rarity === "Rare") {
    // Lime-Green Broadsword with white crossguard (Page 5 #4 weapon)
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(6, -3, 6, 6);
    ctx.fillRect(10, -6, 4, 12);
    ctx.fillRect(13, -4, 17, 8);
    ctx.fillStyle = "#2e473b";
    ctx.fillRect(7, -2, 4, 4);
    ctx.fillStyle = "#f5f9fa";
    ctx.fillRect(11, -5, 2, 10);
    ctx.fillStyle = "#6ef538";
    ctx.fillRect(13, -3, 16, 6);
    ctx.fillStyle = "#d4ffb8";
    ctx.fillRect(13, -3, 15, 2);
  } else if (type === "Rapier" || rarity === "Uncommon") {
    // Cyan Needle Rapier with gold guard (Page 5 #5 weapon)
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(6, -2, 6, 4);
    ctx.fillRect(10, -5, 4, 10);
    ctx.fillRect(13, -2, 18, 4);
    ctx.fillStyle = "#f2c138";
    ctx.fillRect(7, -1, 4, 2);
    ctx.fillRect(11, -4, 2, 8);
    ctx.fillStyle = "#4da6ff";
    ctx.fillRect(13, -1, 17, 2);
    ctx.fillStyle = "#bfe3ff";
    ctx.fillRect(13, -1, 15, 1);
  } else {
    // Silver Sword with gold crossguard (Page 5 #6 weapon)
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(6, -2, 6, 4);
    ctx.fillRect(10, -5, 4, 10);
    ctx.fillRect(13, -3, 16, 6);
    ctx.fillStyle = "#d9a226";
    ctx.fillRect(7, -1, 4, 2);
    ctx.fillRect(11, -4, 2, 8);
    ctx.fillStyle = "#c4ced4";
    ctx.fillRect(13, -2, 15, 4);
    ctx.fillStyle = "#f5f9fa";
    ctx.fillRect(13, -2, 14, 1);
  }
  ctx.restore();
}

export function drawExactSurveyor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  skinId: string,
  equipped: Partial<Record<GearSlot, GearItem>>,
  options?: { walkPhase?: number; guarding?: boolean; attacking?: boolean; invulnerable?: boolean },
) {
  const skin = getSkinTheme(skinId);
  const walk = options?.walkPhase ?? 0;
  const isWalking = walk > 0 && Math.floor(walk * 2) % 2 === 1;
  const flip = facingX < -0.15;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (options?.invulnerable && Math.floor(Date.now() / 65) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(-10, 12, 20, 4);

  const suitFill = equipped.chestplate ? RARITY_HEX[equipped.chestplate.rarity] : skin.body;
  stampPixelMatrix(
    ctx,
    isWalking ? SURVEYOR_WALK_MATRIX : SURVEYOR_IDLE_MATRIX,
    { O: "#0a0d0f", F: suitFill },
    0,
    14,
    2,
    flip,
  );

  if (equipped.helmet) {
    ctx.fillStyle = RARITY_HEX[equipped.helmet.rarity];
    ctx.fillRect(-6, -16, 12, 2);
  }

  if (options?.guarding) {
    ctx.strokeStyle = "#6fe3c1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 18, Math.atan2(facingY, facingX) - 0.85, Math.atan2(facingY, facingX) + 0.85);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(0, -1);
  ctx.rotate(Math.atan2(facingY, facingX));
  drawExactPixelWeapon(ctx, equipped.weapon?.weaponType, equipped.weapon?.rarity, Boolean(options?.attacking));
  ctx.restore();

  ctx.restore();
}

export function drawExactBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  bossSpec: BossSpec,
  nowMs: number,
  options?: { flash?: boolean; scaleOverride?: number },
) {
  const flash = Boolean(options?.flash);
  const arch = bossSpec.archetype;
  const flip = facingX < 0;
  const bob = Math.floor(Math.abs(Math.sin(nowMs * 0.007)) * 2) * 2;
  const pxScale = options?.scaleOverride ? Math.round(options.scaleOverride * 1.5) : 3;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(-24, 14, 48, 6);

  if (arch === "warden-10") {
    stampPixelMatrix(
      ctx,
      VANCE01_MATRIX,
      {
        O: "#0a0d0f",
        R: flash ? "#ffffff" : "#e62e2e",
        D: flash ? "#ffffff" : "#8f1111",
        P: flash ? "#ffffff" : "#ffc2c2",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(flip ? 24 : -32, -8 - bob, 8, 8);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(flip ? 26 : -30, -6 - bob, 4, 4);

    ctx.save();
    ctx.translate(0, -4 - bob);
    ctx.rotate(Math.atan2(facingY, facingX));
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(16, -5, 26, 10);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(18, -3, 22, 6);
    ctx.fillStyle = "#ffc2c2";
    ctx.fillRect(18, -2, 18, 2);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (arch === "riot-20") {
    stampPixelMatrix(
      ctx,
      E1IJ4H_MATRIX,
      {
        O: "#0a0d0f",
        G: flash ? "#ffffff" : "#80eb28",
        D: flash ? "#ffffff" : "#1f7a24",
        W: flash ? "#ffffff" : "#d8ff9e",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.save();
    ctx.translate(0, -4 - bob);
    ctx.rotate(Math.atan2(facingY, facingX));
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(14, -4, 18, 8);
    ctx.fillRect(28, -14, 6, 28);
    ctx.fillStyle = flash ? "#ffffff" : "#80eb28";
    ctx.fillRect(16, -2, 14, 4);
    ctx.fillRect(30, -12, 2, 24);
    ctx.restore();
    ctx.restore();
    return;
  }

  if (arch === "matriarch-30") {
    stampPixelMatrix(
      ctx,
      MATRIARCH_MATRIX,
      {
        O: "#0a0d0f",
        B: flash ? "#ffffff" : "#3a66f2",
        D: flash ? "#ffffff" : "#182e8a",
        C: flash ? "#ffffff" : "#80e8ff",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.restore();
    return;
  }

  stampPixelMatrix(
    ctx,
    VANCE01_MATRIX,
    {
      O: "#0a0d0f",
      R: flash ? "#ffffff" : bossSpec.primaryColor,
      D: flash ? "#ffffff" : bossSpec.secondaryColor,
      P: flash ? "#ffffff" : bossSpec.glowColor,
    },
    0,
    16 - bob,
    pxScale,
    flip,
  );
  ctx.save();
  ctx.translate(0, -4 - bob);
  ctx.rotate(Math.atan2(facingY, facingX));
  drawExactPixelWeapon(ctx, "Executioner", "Legendary", false);
  ctx.restore();
  ctx.restore();
}

export function drawExactEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, nowMs: number) {
  if (enemy.health <= 0) return;

  const isBoss = enemy.kind === "boss";
  const flash = enemy.hitFlashMs > 0;
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);
  const zOffset = Math.round(enemy.z);
  const flip = enemy.facingX < 0;
  const bob = Math.floor(Math.abs(Math.sin(nowMs * 0.008 + enemy.id)) * 1.5) * 2;

  if (enemy.specialWindupMs > 0) {
    const pct = 1 - enemy.specialWindupMs / Math.max(1, enemy.maxSpecialWindupMs);
    ctx.save();
    if (enemy.specialType === "laser-tp") {
      ctx.strokeStyle = `rgba(242, 56, 255, ${0.45 + pct * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(enemy.aimTargetX, enemy.aimTargetY);
      ctx.stroke();
      ctx.strokeRect(enemy.aimTargetX - 8, enemy.aimTargetY - 8, 16, 16);
    } else if (enemy.specialType === "slam") {
      ctx.strokeStyle = `rgba(99, 210, 255, ${0.45 + pct * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.aimTargetX, enemy.aimTargetY, 32 * pct, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (isBoss) {
    drawExactBoss(ctx, x, y, enemy.facingX, enemy.facingY, enemy.bossSpec!, nowMs, { flash });
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x - 10, y + 11, 20, 4);

  ctx.save();
  ctx.translate(x, y - zOffset);

  if (enemy.kind === "flyer") {
    const wingOpen = Math.floor(nowMs / 130) % 2 === 0;
    stampPixelMatrix(
      ctx,
      wingOpen ? FLYER_OPEN_MATRIX : FLYER_TUCK_MATRIX,
      {
        O: "#0a0d0f",
        B: flash ? "#ffffff" : "#3a66f2",
        C: flash ? "#ffffff" : "#80e8ff",
      },
      0,
      10 - bob,
      2,
      flip,
    );
  } else if (enemy.kind === "bandit") {
    stampPixelMatrix(
      ctx,
      BANDIT_MATRIX,
      {
        O: "#0a0d0f",
        Y: flash ? "#ffffff" : "#f5c425",
        W: flash ? "#ffffff" : "#fff7a8",
      },
      0,
      14 - bob,
      2,
      flip,
    );
    if (enemy.stolenGold > 0 || enemy.stolenDiamonds > 0) {
      ctx.fillStyle = "#0a0d0f";
      ctx.fillRect(flip ? 8 : -16, -10 - bob, 8, 10);
      ctx.fillStyle = "#d99b1e";
      ctx.fillRect(flip ? 10 : -14, -8 - bob, 4, 6);
    }
  } else if (enemy.kind === "brute") {
    stampPixelMatrix(
      ctx,
      BRUTE_MATRIX,
      {
        O: "#0a0d0f",
        R: flash ? "#ffffff" : "#e62e2e",
        D: flash ? "#ffffff" : "#8f1111",
        P: flash ? "#ffffff" : "#ffb8b8",
      },
      0,
      14 - bob,
      2,
      flip,
    );
  } else if (enemy.kind === "archer") {
    stampPixelMatrix(
      ctx,
      ARCHER_MATRIX,
      {
        O: "#0a0d0f",
        G: flash ? "#ffffff" : "#80eb28",
        W: flash ? "#ffffff" : "#d8ff9e",
      },
      0,
      14 - bob,
      2,
      flip,
    );
    ctx.save();
    ctx.translate(0, -2 - bob);
    ctx.rotate(Math.atan2(enemy.facingY, enemy.facingX));
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(8, -10, 4, 20);
    ctx.fillStyle = flash ? "#ffffff" : "#80eb28";
    ctx.fillRect(9, -9, 2, 18);
    ctx.restore();
  } else if (enemy.kind === "phaser") {
    stampPixelMatrix(
      ctx,
      PHASER_MATRIX,
      {
        O: "#0a0d0f",
        P: flash ? "#ffffff" : "#8028eb",
        M: flash ? "#ffffff" : "#f238ff",
      },
      0,
      14 - bob,
      2,
      flip,
    );
    ctx.save();
    ctx.translate(0, -2 - bob);
    ctx.rotate(Math.atan2(enemy.facingY, enemy.facingX));
    drawExactPixelWeapon(ctx, "Plasma Cleaver", "Epic", enemy.windupMs > 0 && enemy.windupMs < 130);
    ctx.restore();
  } else {
    stampPixelMatrix(
      ctx,
      STALKER_MATRIX,
      {
        O: "#0a0d0f",
        R: flash ? "#ffffff" : "#e62e2e",
        P: flash ? "#ffffff" : "#ffb8b8",
      },
      0,
      14 - bob,
      2,
      flip,
    );
    ctx.save();
    ctx.translate(0, -2 - bob);
    ctx.rotate(Math.atan2(enemy.facingY, enemy.facingX));
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(8, -3, 18, 6);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(9, -2, 16, 4);
    ctx.restore();
  }

  ctx.restore();

  const barW = 24;
  const barY = y - zOffset - 22 - bob;
  ctx.fillStyle = "#0a0d0f";
  ctx.fillRect(x - barW / 2 - 2, barY - 2, barW + 4, 6);
  const hpPct = Math.max(0, enemy.health / Math.max(1, enemy.maxHealth));
  ctx.fillStyle = enemy.kind === "bandit" ? "#ffcf56" : "#ff5442";
  ctx.fillRect(x - barW / 2, barY, Math.round(barW * hpPct), 2);
}

export function drawPixelBlocker(
  ctx: CanvasRenderingContext2D,
  blocker: RoomBlocker,
  biomeTrim: string,
  biomeAccent: string,
) {
  const bx = Math.round(blocker.x);
  const by = Math.round(blocker.y);
  const bw = Math.round(blocker.width);
  const bh = Math.round(blocker.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(bx + 4, by + 6, bw, bh);

  ctx.fillStyle = "#0a0d0f";
  ctx.fillRect(bx - 2, by - 10, bw + 4, bh + 12);

  ctx.fillStyle = biomeTrim;
  ctx.fillRect(bx, by - 8, bw, bh - 4);

  ctx.fillStyle = "#16221e";
  ctx.fillRect(bx, by + bh - 12, bw, 12);

  ctx.fillStyle = "#0a0d0f";
  ctx.fillRect(bx + 4, by - 4, 2, 2);
  ctx.fillRect(bx + bw - 6, by - 4, 2, 2);

  ctx.fillStyle = biomeAccent;
  if (blocker.shape === "octagon-reactor") {
    ctx.fillRect(bx + Math.floor(bw / 2) - 6, by + Math.floor(bh / 2) - 10, 12, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx + Math.floor(bw / 2) - 2, by + Math.floor(bh / 2) - 6, 4, 4);
  } else if (blocker.shape === "relay-console") {
    ctx.fillRect(bx + 6, by - 4, bw - 12, 4);
    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(bx + 6, by + 2, 8, 4);
  } else {
    ctx.fillRect(bx + Math.floor(bw / 2) - 2, by - 4, 4, bh - 12);
  }
}

export function drawPixelProp(
  ctx: CanvasRenderingContext2D,
  prop: BreakableProp,
  biomeId: string,
  biomeAccent: string,
  nowMs: number,
) {
  if (prop.broken) return;
  const px = Math.round(prop.x);
  const py = Math.round(prop.y);

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(px - 10, py + 8, 20, 4);

  if (prop.kind === "pipe-tree") {
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(px - 6, py - 24, 12, 34);
    ctx.fillRect(px - 16, py - 18, 32, 8);
    ctx.fillRect(px - 12, py - 26, 24, 6);
    ctx.fillStyle = "#2b6fa8";
    ctx.fillRect(px - 4, py - 22, 8, 30);
    ctx.fillRect(px - 14, py - 16, 28, 4);
    ctx.fillRect(px - 10, py - 24, 20, 2);
    ctx.fillStyle = "#7ae6ff";
    ctx.fillRect(px - 2, py - 20, 2, 26);

    const gasPhase = (nowMs * 0.004 + prop.id) % 1;
    ctx.fillStyle = `rgba(155, 232, 255, ${(1 - gasPhase) * 0.65})`;
    ctx.fillRect(Math.round(px - 16 - gasPhase * 8), Math.round(py - 18 - gasPhase * 10), 4, 4);
    ctx.fillRect(Math.round(px + 12 + gasPhase * 8), Math.round(py - 18 - gasPhase * 10), 4, 4);
  } else if (prop.kind === "crystal") {
    const col =
      biomeId === "thermal-abyss" ? "#ff7a45" :
      biomeId === "relay-archives" ? "#b69cff" :
      biomeId === "signal-core" ? "#ffcf56" : "#3ba8e0";
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(px - 6, py - 16, 12, 24);
    ctx.fillRect(px - 4, py - 20, 8, 4);
    ctx.fillStyle = col;
    ctx.fillRect(px - 4, py - 14, 8, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px - 2, py - 16, 4, 14);
  } else if (prop.kind === "canister") {
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(px - 8, py - 14, 16, 22);
    ctx.fillStyle = "#2d5249";
    ctx.fillRect(px - 6, py - 12, 12, 18);
    ctx.fillStyle = biomeAccent;
    ctx.fillRect(px - 4, py - 6, 8, 4);
  } else {
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(px - 10, py - 12, 20, 20);
    ctx.fillStyle = "#8a6236";
    ctx.fillRect(px - 8, py - 10, 16, 16);
    ctx.fillStyle = "#b58954";
    ctx.fillRect(px - 8, py - 10, 16, 4);
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(px - 6, py - 4, 12, 2);
  }
}

export function drawPixelatedRoomMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  biome: BiomeDefinition,
  nowMs: number,
  scrollOffset = 0,
) {
  ctx.imageSmoothingEnabled = false;
  const P = 4;

  const bands = [biome.voidTopColor, biome.voidBottomColor, biome.wallColor];
  const bandH = Math.ceil(height / bands.length);
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i]!;
    ctx.fillRect(0, i * bandH, width, bandH);
    if (i > 0) {
      ctx.fillStyle = bands[i - 1]!;
      for (let x = 0; x < width; x += P * 2) {
        ctx.fillRect(x, i * bandH, P, P);
        ctx.fillRect(x + P, i * bandH + P, P, P);
      }
    }
  }

  const shift = Math.floor(scrollOffset) % 96;
  for (let px = -96; px < width + 96; px += 96) {
    const x = Math.round((px - shift) / P) * P;
    ctx.fillStyle = "#080c0a";
    ctx.fillRect(x, 0, 24, 52);
    ctx.fillStyle = biome.trimColor;
    ctx.fillRect(x + P, 0, 16, 48);
    ctx.fillStyle = biome.accentColor;
    ctx.fillRect(x + P * 2, 8, P, 28);
  }

  const wallTop = 16;
  const floorTop = 48;
  const floorBottom = height - 16;

  ctx.fillStyle = "#080c0a";
  ctx.fillRect(12, wallTop - 4, width - 24, floorTop - wallTop + 4);
  ctx.fillStyle = biome.wallColor;
  ctx.fillRect(16, wallTop, width - 32, floorTop - wallTop);

  const brickW = 32;
  const brickH = 16;
  for (let row = 0; row < 2; row++) {
    const by = wallTop + row * brickH;
    const rowOffset = row % 2 === 0 ? 0 : 16;
    ctx.fillStyle = "#0a0f0d";
    ctx.fillRect(16, by + brickH - P, width - 32, P);
    for (let bx = 16 + rowOffset; bx < width - 20; bx += brickW) {
      ctx.fillStyle = "#0a0f0d";
      ctx.fillRect(bx, by, P, brickH);
      ctx.fillStyle = biome.trimColor;
      ctx.fillRect(bx + P, by + P, brickW - P * 2, P);
    }
  }

  ctx.fillStyle = biome.floorColor;
  ctx.fillRect(16, floorTop, width - 32, floorBottom - floorTop);

  const tileW = 48;
  const tileH = 36;
  for (let ty = floorTop; ty < floorBottom; ty += tileH) {
    const rowIdx = Math.floor((ty - floorTop) / tileH);
    const stagger = (rowIdx % 2) * 24;
    for (let tx = 16 - stagger; tx < width - 16; tx += tileW) {
      const drawX = Math.max(16, tx);
      const drawW = Math.min(width - 16, tx + tileW) - drawX;
      if (drawW <= 4) continue;

      ctx.fillStyle = biome.gridColor;
      ctx.fillRect(drawX, ty, drawW, P);
      ctx.fillRect(drawX, ty, P, Math.min(tileH, floorBottom - ty));

      if (drawW >= 20) {
        ctx.fillStyle = "#090e0c";
        ctx.fillRect(drawX + P * 2, ty + P * 2, P, P);
        ctx.fillRect(drawX + drawW - P * 2, ty + P * 2, P, P);
      }
    }
  }

  ctx.fillStyle = "#070b09";
  ctx.fillRect(12, floorBottom, width - 24, 16);
  for (let hx = 16; hx < width - 24; hx += 24) {
    ctx.fillStyle = biome.trimColor;
    ctx.fillRect(hx, floorBottom + 2, 12, P);
  }

  const pulseOn = Math.floor(nowMs / 550) % 2 === 0;
  ctx.fillStyle = pulseOn ? biome.accentColor : biome.trimColor;
  for (let lx = 48; lx < width - 48; lx += 128) {
    ctx.fillRect(lx, floorTop + P, 16, P);
  }
}

export function drawPixelatedTrainingBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  nowMs: number,
) {
  ctx.imageSmoothingEnabled = false;
  const P = 4;

  ctx.fillStyle = "#080f0c";
  ctx.fillRect(0, 0, width, height);

  const brickW = 36;
  const brickH = 18;
  for (let y = 0; y < groundY + 24; y += brickH) {
    const row = Math.floor(y / brickH);
    const offset = (row % 2) * 18;
    ctx.fillStyle = row % 2 === 0 ? "#0d1814" : "#0b1411";
    ctx.fillRect(0, y, width, brickH - P);
    ctx.fillStyle = "#060b09";
    ctx.fillRect(0, y + brickH - P, width, P);

    for (let x = -offset; x < width; x += brickW) {
      ctx.fillStyle = "#060b09";
      ctx.fillRect(x, y, P, brickH);
      ctx.fillStyle = "#182b24";
      ctx.fillRect(x + P, y, brickW - P * 2, P);
    }
  }

  const racks = [36, width - 92];
  for (let r = 0; r < racks.length; r++) {
    const rx = racks[r]!;
    const ry = groundY - 68;
    ctx.fillStyle = "#050807";
    ctx.fillRect(rx - 4, ry - 4, 60, 96);
    ctx.fillStyle = "#162620";
    ctx.fillRect(rx, ry, 52, 88);
    ctx.fillStyle = "#264036";
    ctx.fillRect(rx + 4, ry + 4, 44, 4);

    for (let row = 0; row < 4; row++) {
      const ledY = ry + 16 + row * 16;
      ctx.fillStyle = "#0a120f";
      ctx.fillRect(rx + 6, ledY, 40, 10);
      const blink = (Math.floor(nowMs / 320) + row + r) % 3 === 0;
      ctx.fillStyle = blink ? "#6fe3c1" : "#275948";
      ctx.fillRect(rx + 10, ledY + 3, 6, 4);
      ctx.fillStyle = (row + r) % 2 === 0 ? "#ffcf56" : "#ff6b5e";
      ctx.fillRect(rx + 20, ledY + 3, 4, 4);
    }
  }

  ctx.fillStyle = "#050807";
  ctx.fillRect(0, 28, width, 12);
  for (let hx = 0; hx < width; hx += 24) {
    ctx.fillStyle = (hx / 24) % 2 === 0 ? "#284238" : "#14241e";
    ctx.fillRect(hx, 30, 12, 8);
  }

  const deckY = groundY + 24;
  ctx.fillStyle = "#050807";
  ctx.fillRect(16, deckY - 4, width - 32, 32);
  ctx.fillStyle = "#192d26";
  ctx.fillRect(20, deckY, width - 40, 24);

  ctx.fillStyle = "#3a6153";
  ctx.fillRect(20, deckY, width - 40, P);
  for (let sx = 24; sx < width - 36; sx += 24) {
    ctx.fillStyle = (sx / 24) % 2 === 0 ? "#d9a226" : "#111a17";
    ctx.fillRect(sx, deckY + 6, 12, 6);
  }
}
