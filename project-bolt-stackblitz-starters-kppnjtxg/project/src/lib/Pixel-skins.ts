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
  unlockFloor: number;
  unlockNote: string;
  history: string;
  buffLabel: string;
  attackPct?: number;
  healthPct?: number;
  staminaBonus?: number;
  speedBonus?: number;
  goldPct?: number;
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
    unlockFloor: 1,
    unlockNote: "Default BTC Expedition Rig",
    history: "Standard-issue Bright Tomorrows Company hazmat shell engineered for initial subterranean reconnaissance.",
    buffLabel: "+2% Move Speed",
    speedBonus: 4,
    body: "#f4f8f7",
    bodyShadow: "#cbd6d3",
    visor: "#0a0d0f",
    visorGlow: "rgba(244, 248, 247, 0.35)",
    trim: "#0a0d0f",
  },
  {
    id: "bulkhead-welder",
    name: "BULKHEAD WELDER",
    unlockFloor: 10,
    unlockNote: "Defeat VANCE-01 (Floor 10)",
    history: "Reinforced iron-slag plating salvaged from the welded Outer Bunker doors after Warden VANCE-01's lockdown.",
    buffLabel: "+4% Max Health",
    healthPct: 0.04,
    body: "#f29b7e",
    bodyShadow: "#a63d29",
    visor: "#1f0906",
    visorGlow: "rgba(255, 138, 128, 0.4)",
    trim: "#59130b",
  },
  {
    id: "mutagen-lab",
    name: "LAB CONTAINMENT",
    unlockFloor: 20,
    unlockNote: "Defeat E1-IJ-4H (Floor 20)",
    history: "Chemical-sealed polymer weave worn by Science Lab researchers before Head Scientist Elijah sealed himself inside his riot suit.",
    buffLabel: "+5 Max Stamina",
    staminaBonus: 5,
    body: "#a8f573",
    bodyShadow: "#4a9c28",
    visor: "#0c2408",
    visorGlow: "rgba(157, 255, 77, 0.4)",
    trim: "#184d12",
  },
  {
    id: "cpu-overclock",
    name: "TOWER OVERCLOCK",
    unlockFloor: 30,
    unlockNote: "Defeat Flyer Matriarch (Floor 30)",
    history: "Cobalt-insulated relay mesh designed to ground high-voltage arcs inside the CPU Towers.",
    buffLabel: "+4% Move Speed",
    speedBonus: 8,
    body: "#75a8ff",
    bodyShadow: "#2b52b8",
    visor: "#091538",
    visorGlow: "rgba(117, 168, 255, 0.42)",
    trim: "#13296e",
  },
  {
    id: "archive-phantom",
    name: "ARCHIVE PHANTOM",
    unlockFloor: 40,
    unlockNote: "Defeat Archivist Null (Floor 40)",
    history: "Phase-dampening violet cloak woven from magnetic tape shielding used by Archive curators.",
    buffLabel: "+4% Attack Power",
    attackPct: 0.04,
    body: "#cf9eff",
    bodyShadow: "#7638b8",
    visor: "#1c0933",
    visorGlow: "rgba(207, 158, 255, 0.42)",
    trim: "#3c1269",
  },
  {
    id: "cryo-sentinel",
    name: "CRYO-CONDUIT RIG",
    unlockFloor: 50,
    unlockNote: "Defeat Cryo Sentinel (Floor 50)",
    history: "Sub-zero thermal suit built by BTC's Head Coolant Engineer to survive liquid-nitrogen shaft ruptures.",
    buffLabel: "+6% Max Health",
    healthPct: 0.06,
    body: "#7ce8ff",
    bodyShadow: "#288cb3",
    visor: "#061d29",
    visorGlow: "rgba(124, 232, 255, 0.45)",
    trim: "#10455c",
  },
  {
    id: "thermal-stoker",
    name: "THERMAL STOKER",
    unlockFloor: 60,
    unlockNote: "Defeat Thermal Titan (Floor 60)",
    history: "Basalt-lined furnace armor forged to withstand radiant heat beside the Complex's lava core.",
    buffLabel: "+5% Attack Power",
    attackPct: 0.05,
    body: "#ff9e5e",
    bodyShadow: "#b84414",
    visor: "#290d03",
    visorGlow: "rgba(255, 158, 94, 0.45)",
    trim: "#611c05",
  },
  {
    id: "barracks-vanguard",
    name: "VANGUARD COMMANDER",
    unlockFloor: 70,
    unlockNote: "Clear Barracks Guardian (Floor 70)",
    history: "Officer-grade tactical carapace issued to senior security commanders stationed in the lower Barracks.",
    buffLabel: "+8 Max Stamina",
    staminaBonus: 8,
    body: "#9ee6cf",
    bodyShadow: "#3b8c73",
    visor: "#08241b",
    visorGlow: "rgba(158, 230, 207, 0.42)",
    trim: "#174a3a",
  },
  {
    id: "refinery-smelter",
    name: "ALLOY SMELTER",
    unlockFloor: 80,
    unlockNote: "Clear Refinery Guardian (Floor 80)",
    history: "Heavy slag-proof shell worn by deep-shaft overseers refining exotic subterranean ores.",
    buffLabel: "+8% Gold Gain",
    goldPct: 0.08,
    body: "#f5c76e",
    bodyShadow: "#a67117",
    visor: "#261803",
    visorGlow: "rgba(245, 199, 110, 0.45)",
    trim: "#593906",
  },
  {
    id: "sovereign-gold",
    name: "SOVEREIGN PRIME",
    unlockFloor: 90,
    unlockNote: "Clear Armory Guardian (Floor 90)",
    history: "Prototype executive regalia stored in the Armory vault—engineered to withstand the Signal Sovereign's carrier wave.",
    buffLabel: "+6% ATK & +6% HP",
    attackPct: 0.06,
    healthPct: 0.06,
    body: "#ffe680",
    bodyShadow: "#ba8b14",
    visor: "#241902",
    visorGlow: "rgba(255, 230, 128, 0.5)",
    trim: "#664905",
  },
];

export function getSkinTheme(skinId: string): SkinTheme {
  return SURVEYOR_SKINS.find((s) => s.id === skinId) ?? SURVEYOR_SKINS.at(0)!;
}

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
 * 1. EXACT PIXEL MATRICES (SURVEYOR, TRAINING DUMMY & ALL 6 HUSK CLASSES)
 * ============================================================================ */

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
  "...OOFFOO...",
  "...OOFFOO...",
  "..OOFFFFOO..",
];

// Tutorial Enemy: Sewn-together burlap sacks filled with cotton on a wooden post
const TRAINING_DUMMY_MATRIX = [
  "....OOOO....",
  "...OBBBBO...",
  "..OBBXXBBO..",
  "..OBBBBBBO..",
  "...OBBBBO...",
  "....OOOO....",
  "..OOBBBBOO..",
  ".OBBBXXBBBO.",
  ".OBBBBBBBBO.",
  "..OBBBBBBO..",
  "...OOOOOO...",
  ".....WW.....",
  ".....WW.....",
  "...WWWWWW...",
];
// Husk Stalker (Crimson trooper with pale pink visor bar — Idle 2 feet vs Walk 1 center foot)
const STALKER_IDLE_MATRIX = [
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

const STALKER_WALK_MATRIX = [
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
  "...OORROO...",
  "...OORROO...",
  "..OORRRROO..",
];

// Husk Brute (Flat-top crimson helmet with protruding pink visor & integrated arm cannon)
const BRUTE_IDLE_MATRIX = [
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
  "...ORROORRO...",
  "...ORROORRO...",
  "..OORROORROO..",
];

const BRUTE_WALK_MATRIX = [
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
  "....OORROO....",
  "....OORROO....",
  "...OORRRROO...",
];

// Husk Archer (Lime-green bowman with 3 vertical helmet slits)
const ARCHER_IDLE_MATRIX = [
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

const ARCHER_WALK_MATRIX = [
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
  "...OOGGOO...",
  "...OOGGOO...",
  "..OOGGGGOO..",
];

// Husk Phaser (Purple trooper with glowing magenta T-visor)
const PHASER_IDLE_MATRIX = [
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

const PHASER_WALK_MATRIX = [
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
  "...OOPPOO...",
  "...OOPPOO...",
  "..OOPPPPOO..",
];

// Mutant Flyer (Cobalt bat-winged creature with 4 cyan eye dots)
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

// Husk Bandit (Golden-yellow 3-pronged crown imp with + eye in dark visor)
const BANDIT_IDLE_MATRIX = [
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

const BANDIT_WALK_MATRIX = [
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
  "...OOYYYYOO...",
  "..OOYYYYYYOO..",
];

/* ============================================================================
 * 2. CUSTOM SECTOR BOSS MATRICES (F10, F20, F30, F40, F50, F60 & F100)
 * ============================================================================ */

// F10: VANCE-01 // IRON WARDEN (Rounded crimson helmet, side pink visor, floating gauntlets)
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
  "...OORROOOORROO...",
];

// F20: E1-IJ-4H // RIOT ARCHITECT (Forest-green slotted riot visor + heavy arm crossbow)
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
  "...OOGGOOOOGGOO...",
];

// F30: FLYER MATRIARCH (3-spiked crown, 5 cyan eyes on teardrop shield, wide wings, 3 talons)
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

// F40: ARCHIVIST NULL (Large deep-purple sentinel with glowing magenta H/T visor & floating fists)
const ARCHIVIST_MATRIX = [
  ".....OOOOOOOO.....",
  "....OPPPPPPPPO....",
  "...OPMMMMMMMMPO...",
  "...OPMMMMMMMMPO...",
  "...OPPPPMMPPPPO...",
  "...OPMMMMMMMMPO...",
  "....OPPPPPPPPO....",
  ".....OOOOOOOO.....",
  "..OOPPPPPPPPPPOO..",
  ".OPPPPPPPPPPPPPPO.",
  "OPPPDDDDDDDDDDPPPO",
  "OPPPPPPPPPPPPPPPPO",
  ".OOPPPPPPPPPPPPOO.",
  "...OOOOOOOOOOOO...",
  "....OPPOOOOPPO....",
  "...OOPPOOOOPPOO...",
];

// F50: CRYO SENTINEL (Pointed frost-blue hood with white snowflake visor & clawed ice hands)
const CRYO_SENTINEL_MATRIX = [
  ".......OOOO.......",
  "......OCCCCO......",
  ".....OCCCCCCO.....",
  "....OCCWCCWCCO....",
  "...OCCCWWWWCCCO...",
  "...OCCWCCCCWCCO...",
  "....OCCCCCCCCO....",
  ".....OOOOOOOO.....",
  "..OOCCCCCCCCCCOO..",
  ".OCCCCCCCCCCCCCCO.",
  "OCCCDDDDDDDDDDCCCO",
  "OCCCCCCCCCCCCCCCCO",
  ".OOCCCCCCCCCCCCOO.",
  "...OOOOOOOOOOOO...",
  "...OCCO.OO.OCCO...",
  "..OOCCO.OO.OCCOO..",
];

// F60: THERMAL TITAN (Crimson furnace armor, twin grey horns, yellow slit-visor)
const THERMAL_TITAN_MATRIX = [
  "..OO..........OO..",
  ".OHHO.OOOOOO.OHHO.",
  ".OHHOORRRRRROOHHO.",
  "..OORRRRRRRRRROO..",
  "..ORYYYYYYYYYRRO..",
  "..ORRRRRRRRRRRRO..",
  "..ORYYYYYYYYYRRO..",
  "...OOOOOOOOOOOO...",
  ".OORRRRRRRRRRRROO.",
  "ORRRRRRRRRRRRRRRRO",
  "ORRRDDDDDDDDDDRRRO",
  "ORRRRRRRRRRRRRRRRO",
  ".OORRRRRRRRRRRROO.",
  "...OOOOOOOOOOOO...",
  "....ORROOOORRO....",
  "...OORROOOORROO...",
];

// F100: SIGNAL SOVEREIGN (Radiant golden CEO crown, 4-point star visor & cross chest emblem)
const SOVEREIGN_MATRIX = [
  "...OO...OO...OO...",
  "..OYYO.OYYO.OYYO..",
  "..OYYYYYYYYYYYYO..",
  ".OYYYYYYWWYYYYYYO.",
  ".OYYYYWWWWWWYYYYO.",
  ".OYYYYYYWWYYYYYYO.",
  "..OYYYYYYYYYYYYO..",
  "...OOOOOOOOOOOO...",
  ".OOYYYYYYYYYYYYOO.",
  "OYYYYYYWWYYYYYYYYO",
  "OYYYYWWWWWWYYYYYYO",
  "OYYYYYYWWYYYYYYYYO",
  ".OOYYYYYYYYYYYYOO.",
  "...OOOOOOOOOOOO...",
  "....OYYOOOOYYO....",
  "...OOYYOOOOYYOO...",
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
  chargeRatio = 0,
) {
  const type = weaponType ?? "Sword";
  ctx.save();
  const chargePull = chargeRatio > 0 ? -0.45 * chargeRatio : 0;
  ctx.rotate(swinging ? -0.78 : 0.14 + chargePull);

  if (chargeRatio > 0.2) {
    ctx.shadowColor = chargeRatio >= 1 ? "#ffcf56" : "#6fe3c1";
    ctx.shadowBlur = chargeRatio >= 1 ? 10 : 5;
  }

  if (type === "Executioner" || rarity === "Legendary") {
    // Golden Executioner with cross-shaped guard & red core gem
    ctx.fillStyle = "#4d2f04";
    ctx.fillRect(6, -2, 6, 4);
    ctx.fillRect(10, -7, 4, 14);
    ctx.fillRect(13, -4, 18, 8);
    ctx.fillStyle = "#b37412";
    ctx.fillRect(7, -1, 4, 2);
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(11, -6, 2, 12);
    ctx.fillRect(14, -3, 16, 6);
    ctx.fillStyle = "#fff7bd";
    ctx.fillRect(14, -3, 15, 2);
    ctx.fillStyle = "#ff2e2e";
    ctx.fillRect(11, -1, 2, 2);
  } else if (type === "Plasma Cleaver" || rarity === "Epic") {
    // Hot-Magenta Plasma Cleaver with twin-pillar purple hilt
    ctx.fillStyle = "#3b0947";
    ctx.fillRect(6, -3, 6, 6);
    ctx.fillRect(11, -6, 19, 11);
    ctx.fillStyle = "#691982";
    ctx.fillRect(7, -2, 4, 4);
    ctx.fillRect(12, -1, 16, 4);
    ctx.fillStyle = "#f238ff";
    ctx.fillRect(12, -5, 17, 4);
    ctx.fillStyle = "#ffb8ff";
    ctx.fillRect(13, -5, 15, 2);
  } else if (type === "Broadsword" || rarity === "Rare") {
    // Lime-Green Broadsword with crisp white crossguard
    ctx.fillStyle = "#174212";
    ctx.fillRect(6, -2, 6, 4);
    ctx.fillRect(10, -6, 4, 12);
    ctx.fillRect(13, -4, 17, 8);
    ctx.fillStyle = "#2e473b";
    ctx.fillRect(7, -1, 4, 2);
    ctx.fillStyle = "#f5f9fa";
    ctx.fillRect(11, -5, 2, 10);
    ctx.fillStyle = "#6ef538";
    ctx.fillRect(13, -3, 16, 6);
    ctx.fillStyle = "#d4ffb8";
    ctx.fillRect(13, -3, 15, 2);
  } else if (type === "Rapier" || rarity === "Uncommon") {
    // Cyan Needle Rapier with golden guard
    ctx.fillStyle = "#103966";
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
    // Silver Sword with golden crossguard
    ctx.fillStyle = "#2d383d";
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
  options?: {
    walkPhase?: number;
    guarding?: boolean;
    attacking?: boolean;
    invulnerable?: boolean;
    chargeRatio?: number;
    previewItem?: GearItem | null;
  },
) {
  const skin = getSkinTheme(skinId);
  const walk = options?.walkPhase ?? 0;
  const isWalking = walk > 0 && Math.floor(walk * 2.2) % 2 === 1;
  const flip = facingX < -0.15;
  const preview = options?.previewItem;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (options?.invulnerable) {
    ctx.globalAlpha = Math.floor(Date.now() / 55) % 2 === 0 ? 0.42 : 0.78;
    ctx.shadowColor = "#63d2ff";
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(-10, 12, 20, 4);

  const activeChest = preview?.slot === "chestplate" ? preview : equipped.chestplate;
  const activeHelm = preview?.slot === "helmet" ? preview : equipped.helmet;
  const activeWeapon = preview?.slot === "weapon" ? preview : equipped.weapon;

  const suitFill = activeChest ? RARITY_HEX[activeChest.rarity] : skin.body;
  stampPixelMatrix(
    ctx,
    isWalking ? SURVEYOR_WALK_MATRIX : SURVEYOR_IDLE_MATRIX,
    { O: skin.trim, F: suitFill },
    0,
    14,
    2,
    flip,
  );

  if (activeHelm) {
    ctx.fillStyle = RARITY_HEX[activeHelm.rarity];
    ctx.fillRect(-6, -16, 12, 2);
  }

  if ((options?.chargeRatio ?? 0) > 0.05) {
    const cr = Math.min(1, options!.chargeRatio!);
    ctx.strokeStyle = cr >= 1 ? "#ffcf56" : "#6fe3c1";
    ctx.lineWidth = cr >= 1 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, -2, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cr);
    ctx.stroke();
  }

  if (options?.guarding) {
    ctx.strokeStyle = "#63d2ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -2, 18, Math.atan2(facingY, facingX) - 0.9, Math.atan2(facingY, facingX) + 0.9);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(0, -1);
  ctx.rotate(Math.atan2(facingY, facingX));
  drawExactPixelWeapon(
    ctx,
    activeWeapon?.weaponType,
    activeWeapon?.rarity,
    Boolean(options?.attacking),
    options?.chargeRatio ?? 0,
  );
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
  options?: { flash?: boolean; scaleOverride?: number; windingUp?: boolean; specialActive?: boolean },
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
    // VANCE-01: Dark crimson outline, rounded helmet, floating gauntlets & overhead/slash sword + yellow shockwave
    stampPixelMatrix(
      ctx,
      VANCE01_MATRIX,
      {
        O: "#6e0d0d",
        R: flash ? "#ffffff" : "#e62e2e",
        D: flash ? "#ffffff" : "#9c1414",
        P: flash ? "#ffffff" : "#ffc2c2",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    // Floating round crimson gauntlet
    ctx.fillStyle = "#6e0d0d";
    ctx.fillRect(flip ? 24 : -32, -8 - bob, 10, 10);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(flip ? 26 : -30, -6 - bob, 6, 6);

    ctx.save();
    ctx.translate(0, -4 - bob);
    const baseAng = Math.atan2(facingY, facingX);
    ctx.rotate(options?.windingUp ? baseAng - 1.1 : baseAng);
    ctx.fillStyle = "#6e0d0d";
    ctx.fillRect(14, -6, 4, 12);
    ctx.fillRect(17, -4, 24, 8);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(15, -5, 2, 10);
    ctx.fillRect(18, -3, 21, 6);
    ctx.fillStyle = "#ffc2c2";
    ctx.fillRect(18, -2, 18, 2);
    if (options?.specialActive) {
      // Yellow crescent shockwave arc
      ctx.strokeStyle = "#ffcf56";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(28, 0, 22, -0.85, 0.85);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  if (arch === "riot-20") {
    // E1-IJ-4H: Forest-green outline, 6-slit visor & heavy arm crossbow
    stampPixelMatrix(
      ctx,
      E1IJ4H_MATRIX,
      {
        O: "#144d17",
        G: flash ? "#ffffff" : "#80eb28",
        D: flash ? "#ffffff" : "#227a26",
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
    ctx.fillStyle = "#144d17";
    ctx.fillRect(14, -4, 18, 8);
    ctx.fillRect(28, -14, 6, 28);
    ctx.fillStyle = flash ? "#ffffff" : "#80eb28";
    ctx.fillRect(16, -2, 14, 4);
    ctx.fillRect(30, -12, 2, 24);
    if (options?.windingUp) {
      ctx.fillStyle = "#d8ff9e";
      ctx.fillRect(18, -1, 18, 2);
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  if (arch === "matriarch-30") {
    // FLYER MATRIARCH: Cobalt outline, 3-spiked crown, 5-eyed teardrop face, 3 talons
    stampPixelMatrix(
      ctx,
      MATRIARCH_MATRIX,
      {
        O: "#10216b",
        B: flash ? "#ffffff" : "#3a66f2",
        D: flash ? "#ffffff" : "#1c389e",
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

  if (arch === "archivist-40") {
    // ARCHIVIST NULL: Deep purple outline, magenta H/T visor & floating fists
    stampPixelMatrix(
      ctx,
      ARCHIVIST_MATRIX,
      {
        O: "#350e59",
        P: flash ? "#ffffff" : "#8028eb",
        D: flash ? "#ffffff" : "#4b148f",
        M: flash ? "#ffffff" : "#f238ff",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.fillStyle = "#350e59";
    ctx.fillRect(-32, -8 - bob, 10, 10);
    ctx.fillRect(22, -8 - bob, 10, 10);
    ctx.fillStyle = flash ? "#ffffff" : "#8028eb";
    ctx.fillRect(-30, -6 - bob, 6, 6);
    ctx.fillRect(24, -6 - bob, 6, 6);
    ctx.restore();
    return;
  }

  if (arch === "cryo-50") {
    // CRYO SENTINEL: Frost-blue pointed hood, white snowflake visor & clawed hands
    stampPixelMatrix(
      ctx,
      CRYO_SENTINEL_MATRIX,
      {
        O: "#0f4c75",
        C: flash ? "#ffffff" : "#2da8ff",
        D: flash ? "#ffffff" : "#1565a8",
        W: flash ? "#ffffff" : "#e8f9ff",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.fillStyle = flash ? "#ffffff" : "#2da8ff";
    ctx.fillRect(-30, -6 - bob, 8, 8);
    ctx.fillRect(22, -6 - bob, 8, 8);
    ctx.restore();
    return;
  }

  if (arch === "thermal-60") {
    // THERMAL TITAN: Crimson furnace armor, grey horns, yellow slit-visor, shovel & lava cannon
    stampPixelMatrix(
      ctx,
      THERMAL_TITAN_MATRIX,
      {
        O: "#590e09",
        R: flash ? "#ffffff" : "#e62e2e",
        D: flash ? "#ffffff" : "#8f1111",
        H: flash ? "#ffffff" : "#a3b0b8",
        Y: flash ? "#ffffff" : "#ffe047",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    // Grey shovel on back/side + left arm lava cannon
    ctx.fillStyle = "#1f2426";
    ctx.fillRect(flip ? 20 : -24, -22 - bob, 4, 18);
    ctx.fillStyle = "#b5c2c9";
    ctx.fillRect(flip ? 18 : -26, -28 - bob, 8, 8);
    ctx.fillStyle = "#590e09";
    ctx.fillRect(flip ? -34 : 20, -8 - bob, 14, 10);
    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(flip ? -34 : 32, -6 - bob, 2, 6);
    ctx.restore();
    return;
  }

  if (arch === "sovereign-100" || arch === "overdrive-apex") {
    // SIGNAL SOVEREIGN: Radiant gold crown, 4-point star visor, chest cross & 3-pronged energy gauntlet
    stampPixelMatrix(
      ctx,
      SOVEREIGN_MATRIX,
      {
        O: "#996a08",
        Y: flash ? "#ffffff" : "#ffcf33",
        W: flash ? "#ffffff" : "#fffbe0",
      },
      0,
      16 - bob,
      pxScale,
      flip,
    );
    ctx.fillStyle = "#996a08";
    ctx.fillRect(flip ? -34 : 20, -10 - bob, 14, 12);
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(flip ? -36 : 32, -9 - bob, 4, 2);
    ctx.fillRect(flip ? -36 : 32, -5 - bob, 4, 2);
    ctx.fillRect(flip ? -36 : 32, -1 - bob, 4, 2);
    ctx.restore();
    return;
  }

  stampPixelMatrix(
    ctx,
    VANCE01_MATRIX,
    {
      O: "#1a1f1d",
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
  const walkFrame = Math.floor(nowMs / 170 + enemy.id) % 2 === 1;
  const bob = walkFrame ? 2 : 0;

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
    drawExactBoss(ctx, x, y, enemy.facingX, enemy.facingY, enemy.bossSpec!, nowMs, {
      flash,
      windingUp: enemy.windupMs > 0 || enemy.specialWindupMs > 0,
      specialActive: enemy.specialWindupMs > 0 && enemy.specialWindupMs < 180,
    });
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x - 10, y + 11, 20, 4);

  ctx.save();
  ctx.translate(x, y - zOffset);

  if (enemy.kind === "dummy") {
    stampPixelMatrix(
      ctx,
      TRAINING_DUMMY_MATRIX,
      {
        O: "#4a3219",
        B: flash ? "#ffffff" : "#c99e67",
        X: flash ? "#ffffff" : "#593818",
        W: "#6e4726",
      },
      0,
      14,
      2,
      false,
    );
  } else if (enemy.kind === "flyer") {
    const wingOpen = Math.floor(nowMs / 130) % 2 === 0;
    stampPixelMatrix(
      ctx,
      wingOpen ? FLYER_OPEN_MATRIX : FLYER_TUCK_MATRIX,
      {
        O: "#10216b",
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
      walkFrame ? BANDIT_WALK_MATRIX : BANDIT_IDLE_MATRIX,
      {
        O: "#8c6208",
        Y: flash ? "#ffffff" : "#f5c425",
        W: flash ? "#ffffff" : "#fff7a8",
      },
      0,
      14 - bob,
      2,
      flip,
    );
    if (enemy.stolenGold > 0 || enemy.stolenDiamonds > 0) {
      ctx.fillStyle = "#6e4b04";
      ctx.fillRect(flip ? 8 : -16, -10 - bob, 8, 10);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(flip ? 10 : -14, -8 - bob, 4, 6);
    }
  } else if (enemy.kind === "brute") {
    stampPixelMatrix(
      ctx,
      walkFrame ? BRUTE_WALK_MATRIX : BRUTE_IDLE_MATRIX,
      {
        O: "#6e0d0d",
        R: flash ? "#ffffff" : "#e62e2e",
        D: flash ? "#ffffff" : "#9c1414",
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
      walkFrame ? ARCHER_WALK_MATRIX : ARCHER_IDLE_MATRIX,
      {
        O: "#144d17",
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
    ctx.fillStyle = "#144d17";
    ctx.fillRect(8, -10, 4, 20);
    ctx.fillStyle = flash ? "#ffffff" : "#80eb28";
    ctx.fillRect(9, -9, 2, 18);
    if (enemy.specialWindupMs > 0) {
      ctx.fillStyle = "#d8ff9e";
      ctx.fillRect(4, -1, 14, 2);
    }
    ctx.restore();
  } else if (enemy.kind === "phaser") {
    stampPixelMatrix(
      ctx,
      walkFrame ? PHASER_WALK_MATRIX : PHASER_IDLE_MATRIX,
      {
        O: "#350e59",
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
      walkFrame ? STALKER_WALK_MATRIX : STALKER_IDLE_MATRIX,
      {
        O: "#6e0d0d",
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
    ctx.fillStyle = "#6e0d0d";
    ctx.fillRect(8, -3, 18, 6);
    ctx.fillStyle = flash ? "#ffffff" : "#e62e2e";
    ctx.fillRect(9, -2, 16, 4);
    ctx.restore();
  }

  ctx.restore();

  if (enemy.kind !== "dummy") {
    const barW = 24;
    const barY = y - zOffset - 22 - bob;
    ctx.fillStyle = "#0a0d0f";
    ctx.fillRect(x - barW / 2 - 2, barY - 2, barW + 4, 6);
    const hpPct = Math.max(0, enemy.health / Math.max(1, enemy.maxHealth));
    ctx.fillStyle = enemy.kind === "bandit" ? "#ffcf56" : "#ff5442";
    ctx.fillRect(x - barW / 2, barY, Math.round(barW * hpPct), 2);
  }

  if (enemy.kind === "bandit" && enemy.stealEscapeTimerMs > 0) {
    ctx.fillStyle = "#ffcf56";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${(enemy.stealEscapeTimerMs / 1000).toFixed(1)}s`, x, y - 30 - bob);
  }
}

export function drawPixelBlocker(
  ctx: CanvasRenderingContext2D,
  blocker: RoomBlocker,
  biomeTrim: string,
  biomeAccent: string,
  biomeId?: string,
) {
  const bx = Math.round(blocker.x);
  const by = Math.round(blocker.y);
  const bw = Math.round(blocker.width);
  const bh = Math.round(blocker.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.fillRect(bx + 4, by + 6, bw, bh);

  ctx.fillStyle = "#0a0d0f";
  ctx.fillRect(bx - 2, by - 10, bw + 4, bh + 12);

  // Sector-themed cover blocks (Warehouse Shipping Containers, Science Lab Vats, CPU Server Racks, Archive Bookcases, Thermal Furnaces)
  if (biomeId === "outside-warehouse") {
    ctx.fillStyle = "#7a5228";
    ctx.fillRect(bx, by - 8, bw, bh - 4);
    ctx.fillStyle = "#4d3216";
    ctx.fillRect(bx, by + bh - 12, bw, 12);
    ctx.fillStyle = "#a8763e";
    ctx.fillRect(bx + 4, by - 4, bw - 8, 4);
    ctx.fillRect(bx + 4, by + 6, bw - 8, 4);
    return;
  }

  if (biomeId === "science-labs") {
    ctx.fillStyle = "#1d4a35";
    ctx.fillRect(bx, by - 8, bw, bh - 4);
    ctx.fillStyle = "#102b1e";
    ctx.fillRect(bx, by + bh - 12, bw, 12);
    ctx.fillStyle = "#6fe39c";
    ctx.fillRect(bx + 6, by - 4, bw - 12, Math.max(6, bh - 16));
    ctx.fillStyle = "#d4ffe3";
    ctx.fillRect(bx + 10, by - 2, 4, Math.max(4, bh - 20));
    return;
  }

  if (biomeId === "cpu-towers") {
    ctx.fillStyle = "#182c59";
    ctx.fillRect(bx, by - 8, bw, bh - 4);
    ctx.fillStyle = "#0e1a38";
    ctx.fillRect(bx, by + bh - 12, bw, 12);
    for (let ry = by - 4; ry < by + bh - 16; ry += 8) {
      ctx.fillStyle = "#091124";
      ctx.fillRect(bx + 4, ry, bw - 8, 5);
      ctx.fillStyle = "#63b3ff";
      ctx.fillRect(bx + 8, ry + 1, 4, 3);
      ctx.fillStyle = "#ffcf56";
      ctx.fillRect(bx + 16, ry + 1, 4, 3);
    }
    return;
  }

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
      biomeId === "thermal-core" || biomeId === "refinery" ? "#ff7a45" :
      biomeId === "archives" || biomeId === "signal-core" ? "#b69cff" :
      biomeId === "science-labs" ? "#79f29c" : "#3ba8e0";
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

  if (biome.id === "outside-warehouse") {
    for (let wx = 20; wx < width - 24; wx += 12) {
      ctx.fillStyle = (wx / 12) % 2 === 0 ? "#4c595e" : "#384347";
      ctx.fillRect(wx, wallTop, 8, floorTop - wallTop);
    }
    for (let sx = 64; sx < width - 80; sx += 160) {
      ctx.fillStyle = "#bfe8ff";
      ctx.fillRect(sx, wallTop + 6, 48, 14);
      ctx.fillStyle = "#1c2426";
      ctx.fillRect(sx + 22, wallTop + 6, 4, 14);
    }
  } else {
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

  if (biome.id === "science-labs") {
    ctx.fillStyle = "rgba(111, 227, 156, 0.25)";
    ctx.fillRect(180, 140, 44, 16);
    ctx.fillRect(420, 270, 56, 20);
  } else if (biome.id === "thermal-core") {
    ctx.fillStyle = "#ff6b35";
    ctx.fillRect(210, 195, 64, 4);
    ctx.fillRect(460, 120, 48, 4);
  } else if (biome.id === "signal-core") {
    ctx.strokeStyle = "rgba(255, 71, 126, 0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, floorTop + 20, width - 80, floorBottom - floorTop - 40);
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
