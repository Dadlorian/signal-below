import { useEffect, useRef, useState } from "react";
import BuriedComplexGame, {
  SURVEYOR_SKINS,
  drawPixelSurveyorSprite,
} from "./components/BuriedComplexGame";
import { FULL_ITEM_CATALOG, computePlayerMaxStats } from "./lib/deep-signal-engine";
import { loadSurveyorProfile, type SurveyorProfile } from "./lib/deep-signal-store";

function getSkinPalette(skinId: string) {
  const skin = SURVEYOR_SKINS.find((s) => s.id === skinId) ?? SURVEYOR_SKINS.at(0)!;
  return {
    name: skin.name,
    suit: skin.body,
    trim: skin.trim,
    visor: skin.visor,
  };
}
function drawPixelLegendaryItemDrop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  slot: "weapon" | "helmet" | "chestplate" | "pants" | "shoes" | "necklace" | "ring",
) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = "rgba(255, 207, 86, 0.28)";
  ctx.fillRect(-9, -9, 18, 18);

  const gold = "#ffe082";
  const bright = "#fff8db";
  const trim = "#a66c14";

  if (slot === "weapon") {
    ctx.fillStyle = gold;
    ctx.fillRect(2, -7, 5, 5);
    ctx.fillRect(0, -5, 4, 4);
    ctx.fillRect(-2, -3, 4, 4);
    ctx.fillStyle = bright;
    ctx.fillRect(4, -7, 3, 3);
    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(-5, 0, 5, 2);
    ctx.fillRect(-2, 2, 2, 4);
    ctx.fillStyle = trim;
    ctx.fillRect(-6, 4, 3, 3);
  } else if (slot === "helmet") {
    ctx.fillStyle = gold;
    ctx.fillRect(-5, -5, 10, 8);
    ctx.fillStyle = bright;
    ctx.fillRect(-3, -6, 6, 2);
    ctx.fillStyle = "#0d1715";
    ctx.fillRect(-4, -2, 8, 3);
    ctx.fillStyle = bright;
    ctx.fillRect(-3, -1, 6, 1);
  } else if (slot === "chestplate") {
    ctx.fillStyle = bright;
    ctx.fillRect(-6, -5, 3, 3);
    ctx.fillRect(3, -5, 3, 3);
    ctx.fillStyle = gold;
    ctx.fillRect(-4, -4, 8, 8);
    ctx.fillStyle = trim;
    ctx.fillRect(-2, -2, 4, 3);
    ctx.fillStyle = bright;
    ctx.fillRect(-1, -1, 2, 2);
  } else if (slot === "pants") {
    ctx.fillStyle = trim;
    ctx.fillRect(-4, -6, 8, 3);
    ctx.fillStyle = gold;
    ctx.fillRect(-4, -3, 3, 9);
    ctx.fillRect(1, -3, 3, 9);
    ctx.fillStyle = bright;
    ctx.fillRect(-4, 0, 3, 2);
    ctx.fillRect(1, 0, 3, 2);
  } else if (slot === "shoes") {
    ctx.fillStyle = gold;
    ctx.fillRect(-6, -3, 4, 7);
    ctx.fillRect(-6, 2, 6, 3);
    ctx.fillRect(1, -3, 4, 7);
    ctx.fillRect(1, 2, 6, 3);
    ctx.fillStyle = trim;
    ctx.fillRect(-6, 5, 6, 2);
    ctx.fillRect(1, 5, 6, 2);
  } else if (slot === "necklace") {
    ctx.fillStyle = "#e8f2ee";
    ctx.fillRect(-3, -6, 6, 1);
    ctx.fillRect(-4, -5, 1, 5);
    ctx.fillRect(3, -5, 1, 5);
    ctx.fillStyle = trim;
    ctx.fillRect(-2, 0, 4, 5);
    ctx.fillStyle = bright;
    ctx.fillRect(-1, 1, 2, 3);
  } else {
    ctx.fillStyle = bright;
    ctx.fillRect(-2, -6, 4, 3);
    ctx.fillStyle = gold;
    ctx.fillRect(-4, -3, 8, 2);
    ctx.fillRect(-5, -1, 2, 4);
    ctx.fillRect(3, -1, 2, 4);
    ctx.fillStyle = trim;
    ctx.fillRect(-4, 3, 8, 2);
  }

  ctx.restore();
}

function SurveyorWorkoutCanvas({ profile }: { profile: SurveyorProfile }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let lastTime = performance.now();

    let attackMs = 0;
    let cooldownMs = 0;
    let bossFlashMs = 0;
    let bossRecoilX = 0;
    let hitCount = 0;
    let dropIndex = 0;

    type LegendarySlotKind = "weapon" | "helmet" | "chestplate" | "pants" | "shoes" | "necklace" | "ring";
    const LEGENDARY_SLOTS: LegendarySlotKind[] = [
      "weapon",
      "helmet",
      "chestplate",
      "pants",
      "shoes",
      "necklace",
      "ring",
    ];

    const FULL_LEGENDARY_PREVIEW = {
      weapon: {
        id: "prev-w",
        baseKey: "weapon:Legendary:sovereign executioner",
        name: "Sovereign Executioner",
        rarity: "Legendary" as const,
        slot: "weapon" as const,
        count: 1,
        power: 22,
        attackBonus: 52,
        healthBonus: 0,
        guardBonus: 0,
        agilityBonus: 0,
        weaponType: "Executioner" as const,
        ascensionRank: 3,
      },
      helmet: {
        id: "prev-h",
        baseKey: "helmet:Legendary:sovereign crown",
        name: "Sovereign Crown",
        rarity: "Legendary" as const,
        slot: "helmet" as const,
        count: 1,
        power: 20,
        attackBonus: 0,
        healthBonus: 92,
        guardBonus: 88,
        agilityBonus: 0,
        ascensionRank: 3,
      },
      chestplate: {
        id: "prev-c",
        baseKey: "chestplate:Legendary:core exo",
        name: "Core Exo",
        rarity: "Legendary" as const,
        slot: "chestplate" as const,
        count: 1,
        power: 20,
        attackBonus: 0,
        healthBonus: 158,
        guardBonus: 0,
        agilityBonus: 0,
        ascensionRank: 3,
      },
      pants: {
        id: "prev-p",
        baseKey: "pants:Legendary:void striders",
        name: "Void Striders",
        rarity: "Legendary" as const,
        slot: "pants" as const,
        count: 1,
        power: 20,
        attackBonus: 0,
        healthBonus: 114,
        guardBonus: 90,
        agilityBonus: 0,
        ascensionRank: 3,
      },
      shoes: {
        id: "prev-s",
        baseKey: "shoes:Legendary:apex thrusters",
        name: "Apex Thrusters",
        rarity: "Legendary" as const,
        slot: "shoes" as const,
        count: 1,
        power: 20,
        attackBonus: 0,
        healthBonus: 0,
        guardBonus: 0,
        agilityBonus: 12,
        ascensionRank: 3,
      },
      necklace: {
        id: "prev-n",
        baseKey: "necklace:Legendary:signal pendulum",
        name: "Signal Pendulum",
        rarity: "Legendary" as const,
        slot: "necklace" as const,
        count: 1,
        power: 20,
        attackBonus: 40,
        healthBonus: 80,
        guardBonus: 0,
        agilityBonus: 5,
        ascensionRank: 3,
      },
      ring: {
        id: "prev-r",
        baseKey: "ring:Legendary:sovereign seal",
        name: "Sovereign Seal",
        rarity: "Legendary" as const,
        slot: "ring" as const,
        count: 1,
        power: 20,
        attackBonus: 20,
        healthBonus: 0,
        guardBonus: 100,
        agilityBonus: 10,
        ascensionRank: 3,
      },
    };

    const drops: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vz: number;
      kind: "gold" | "gem" | "legendary";
      slot?: LegendarySlotKind;
      label: string;
    }> = [];
    const sparks: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }> = [];
    const popups: Array<{ x: number; y: number; text: string; color: string; life: number }> = [];

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          const W = canvas.width;
          const H = canvas.height;
          const groundY = 154;
          const playerX = 148;
          const bossX = 272;
          const palette = getSkinPalette(profile.activeSkin);

          attackMs = Math.max(0, attackMs - dt * 1000);
          cooldownMs = Math.max(0, cooldownMs - dt * 1000);
          bossFlashMs = Math.max(0, bossFlashMs - dt * 1000);
          bossRecoilX = Math.max(0, bossRecoilX - 60 * dt);

          // Continuous slash loop against the stationary Boss Dummy
          if (cooldownMs <= 0) {
            attackMs = 190;
            cooldownMs = 430;
            bossFlashMs = 100;
            bossRecoilX = 9;
            hitCount += 1;

            for (let s = 0; s < 8; s++) {
              const ang = (Math.PI * 2 * s) / 8 + Math.random() * 0.4;
              sparks.push({
                x: bossX - 10,
                y: groundY - 12,
                vx: Math.cos(ang) * (55 + Math.random() * 65),
                vy: Math.sin(ang) * (45 + Math.random() * 55) - 35,
                color: hitCount % 3 === 0 ? "#ffcf56" : "#6fe3c1",
                life: 0.42,
              });
            }

            // Spawn Gold every hit
            drops.push({
              x: bossX - 12,
              y: groundY,
              z: 14,
              vx: -25 - Math.random() * 45,
              vz: 110 + Math.random() * 45,
              kind: "gold",
              label: "+50G",
            });

            // Every 2nd hit drops a Gem; every 3rd hit drops a Legendary Item icon
            if (hitCount % 2 === 0) {
              drops.push({
                x: bossX - 10,
                y: groundY,
                z: 16,
                vx: -35 - Math.random() * 40,
                vz: 130,
                kind: "gem",
                label: "+2 GEMS",
              });
            }
            if (hitCount % 3 === 0) {
              const nextSlot = LEGENDARY_SLOTS[dropIndex % LEGENDARY_SLOTS.length];
              dropIndex += 1;
              drops.push({
                x: bossX - 8,
                y: groundY,
                z: 18,
                vx: -40 - Math.random() * 35,
                vz: 150,
                kind: "legendary",
                slot: nextSlot,
                label: "★ LEGENDARY",
              });
            }
          }

          // Background & static grid
          ctx.fillStyle = "#09110e";
          ctx.fillRect(0, 0, W, H);

          ctx.strokeStyle = "#162620";
          ctx.lineWidth = 1;
          for (let gx = 0; gx <= W; gx += 24) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, H);
            ctx.stroke();
          }
          for (let gy = 0; gy <= H; gy += 24) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(W, gy);
            ctx.stroke();
          }

          // 2.6V Training Platform Deck
          ctx.fillStyle = "#14241e";
          ctx.fillRect(24, groundY + 24, W - 48, 24);
          ctx.strokeStyle = "#2d4d41";
          ctx.lineWidth = 2;
          ctx.strokeRect(24, groundY + 24, W - 48, 24);

          // Draw Stationary Armored Boss Dummy on the Right
          const bx = Math.round(bossX + bossRecoilX);
          const by = groundY;
          const bBob = Math.abs(Math.sin(now * 0.006)) * 2;
          const flash = bossFlashMs > 0;

          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.beginPath();
          ctx.ellipse(bx, by + 24, 24, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          const bDark = flash ? "#ffffff" : "#3d2805";
          const bMain = flash ? "#ffffff" : "#d99b1e";
          const bGlow = flash ? "#ffffff" : "#ffe082";

          // Pedestal post & heavy boss torso
          ctx.fillStyle = "#2b3833";
          ctx.fillRect(bx - 6, by + 6, 12, 18);
          ctx.fillStyle = bDark;
          ctx.fillRect(bx - 18, Math.round(by - 22 - bBob), 36, 28);
          ctx.fillStyle = bMain;
          ctx.fillRect(bx - 16, Math.round(by - 20 - bBob), 32, 24);
          // Chest core
          ctx.fillStyle = bDark;
          ctx.fillRect(bx - 6, Math.round(by - 12 - bBob), 12, 10);
          ctx.fillStyle = bGlow;
          ctx.fillRect(bx - 4, Math.round(by - 10 - bBob), 8, 6);
          // Boss helm & horns
          ctx.fillStyle = bDark;
          ctx.fillRect(bx - 14, Math.round(by - 42 - bBob), 28, 20);
          ctx.fillStyle = bMain;
          ctx.fillRect(bx - 12, Math.round(by - 40 - bBob), 24, 16);
          ctx.fillStyle = bGlow;
          ctx.fillRect(bx - 14, Math.round(by - 50 - bBob), 5, 9);
          ctx.fillRect(bx + 9, Math.round(by - 50 - bBob), 5, 9);
          ctx.fillRect(bx - 3, Math.round(by - 53 - bBob), 6, 11);
          // Visor
          ctx.fillStyle = "#080b0d";
          ctx.fillRect(bx - 10, Math.round(by - 33 - bBob), 14, 5);
          ctx.fillStyle = bGlow;
          ctx.fillRect(bx - 9, Math.round(by - 32 - bBob), 11, 3);

          // Bouncing Gold, Gems & Legendary Item Icons magnetized to Surveyor
          for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops.at(i)!;
            d.x += d.vx * dt;
            d.vx *= 0.9;
            d.z += d.vz * dt;
            d.vz -= 360 * dt;
            if (d.z <= 0) {
              d.z = 0;
              d.vz = Math.abs(d.vz) > 35 ? -d.vz * 0.45 : 0;
            }

            // Magnetize back to stationary Surveyor once past apex
            if (d.vz <= 40) {
              const pullDir = playerX - d.x;
              d.x += Math.sign(pullDir) * 230 * dt;
            }

            const cy = Math.round(d.y + 12 - d.z);
            const cx = Math.round(d.x);
            if (d.kind === "legendary" && d.slot) {
              drawPixelLegendaryItemDrop(ctx, cx, cy - 2, d.slot);
            } else if (d.kind === "gem") {
              ctx.fillStyle = "#5ec8ff";
              ctx.fillRect(cx - 5, cy - 5, 10, 10);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(cx - 2, cy - 3, 3, 3);
            } else {
              ctx.fillStyle = "#d99b1e";
              ctx.fillRect(cx - 5, cy - 4, 10, 8);
              ctx.fillStyle = "#ffdf5e";
              ctx.fillRect(cx - 4, cy - 5, 8, 8);
            }

            if (Math.abs(playerX - d.x) < 18 && d.vz <= 40) {
              popups.push({
                x: playerX,
                y: d.kind === "legendary" ? groundY - 44 : groundY - 30,
                text: d.label,
                color: d.kind === "legendary" ? "#ffe082" : d.kind === "gem" ? "#5ec8ff" : "#ffcf4d",
                life: d.kind === "legendary" ? 0.75 : 0.65,
              });
              drops.splice(i, 1);
            }
          }

          const lungeX = attackMs > 0 ? 12 : 0;
          ctx.save();
          ctx.translate(Math.round(playerX + lungeX), groundY);
          ctx.scale(2.25, 2.25);
          drawPixelSurveyorSprite(
            ctx,
            0,
            0,
            1,
            0,
            profile.activeSkin,
            FULL_LEGENDARY_PREVIEW,
            { attacking: attackMs > 0 },
          );
          if (attackMs > 0) {
            ctx.strokeStyle = "#ffcf56";
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(0, -3, 24, -0.85, 0.85);
            ctx.stroke();
          }
          ctx.restore();

          for (let i = sparks.length - 1; i >= 0; i--) {
            const sp = sparks.at(i)!;
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 190 * dt;
            sp.life -= dt;
            if (sp.life <= 0) {
              sparks.splice(i, 1);
              continue;
            }
            ctx.fillStyle = sp.color;
            ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 3, 3);
          }

          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          for (let i = popups.length - 1; i >= 0; i--) {
            const p = popups.at(i)!;
            p.y -= 28 * dt;
            p.life -= dt;
            if (p.life <= 0) {
              popups.splice(i, 1);
              continue;
            }
            ctx.fillStyle = p.color;
            ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
          }

          ctx.fillStyle = "#ffcf56";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "left";
          ctx.fillText("BOSS DUMMY // LEGENDARY LOOT DRILL", 18, 22);

          ctx.fillStyle = "#8ab5a4";
          ctx.textAlign = "right";
          ctx.fillText(`SKIN: ${palette.name}`, W - 18, 22);
        }
      }
      raf = window.requestAnimationFrame(render);
    };

    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [profile]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={220}
      style={{
        width: "100%",
        maxWidth: 460,
        height: "auto",
        borderRadius: 12,
        border: "2px solid #243d34",
        imageRendering: "pixelated",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55)",
      }}
    />
  );
}

function SignalAppLogoTile() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#08120f";
    ctx.fillRect(0, 0, 96, 96);

    ctx.strokeStyle = "#6fe3c1";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 88, 88);

    ctx.fillStyle = "#142922";
    ctx.beginPath();
    ctx.arc(48, 64, 28, Math.PI, 0);
    ctx.lineTo(76, 84);
    ctx.lineTo(20, 84);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#6fe3c1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(48, 46, 12, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(48, 46, 20, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.fillStyle = "#d8eee4";
    ctx.fillRect(40, 52, 16, 12);
    ctx.fillStyle = "#7af5d8";
    ctx.fillRect(43, 55, 10, 4);

    ctx.fillStyle = "#ffcf56";
    ctx.fillRect(46, 66, 4, 14);
    ctx.fillRect(42, 68, 12, 3);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={96}
      height={96}
      style={{
        width: 96,
        height: 96,
        borderRadius: 18,
        imageRendering: "pixelated",
        boxShadow: "0 10px 26px rgba(111, 227, 193, 0.25)",
      }}
    />
  );
}

export default function App() {
  const [inGame, setInGame] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.location.pathname.startsWith("/play/deep-signal") : false,
  );
  const [profile, setProfile] = useState<SurveyorProfile>(() => loadSurveyorProfile());

  useEffect(() => {
    const onPopState = () => {
      const playing = window.location.pathname.startsWith("/play/deep-signal");
      setInGame(playing);
      if (!playing) setProfile(loadSurveyorProfile());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const launchGame = () => {
    window.history.pushState({}, "", "/play/deep-signal");
    setInGame(true);
  };

  const exitToWebsite = () => {
    window.history.pushState({}, "", "/");
    setProfile(loadSurveyorProfile());
    setInGame(false);
  };

  if (inGame) {
    return <BuriedComplexGame onBackToArcade={exitToWebsite} />;
  }

  const stats = computePlayerMaxStats(
    profile.level,
    profile.stats,
    profile.equippedGear,
    profile.slotUpgradeLevels,
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 20% 0%, #10241d 0%, #070d0b 58%, #040807 100%)",
        color: "#e6f5ee",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px 64px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: 1020,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          background: "rgba(12, 22, 19, 0.88)",
          border: "1px solid #223b32",
          borderRadius: 12,
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 3,
              background: "#6fe3c1",
              boxShadow: "0 0 12px #6fe3c1",
            }}
          />
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: 2, color: "#f2fff9" }}>
            JB PLAYNET
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 5,
              background: "#163027",
              color: "#6fe3c1",
              fontWeight: 800,
            }}
          >
            v2.6
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
          <span style={{ color: "#ffcf4d", fontWeight: 700 }}>{profile.gold} GOLD</span>
          <span style={{ color: "#5ec8ff", fontWeight: 700 }}>{profile.diamonds} DIAMONDS</span>
          <a
            href="#featured-apps"
            style={{
              color: "#06120e",
              background: "#6fe3c1",
              padding: "6px 12px",
              borderRadius: 7,
              fontWeight: 900,
              textDecoration: "none",
              fontSize: 11,
            }}
          >
            APPS ↓
          </a>
        </div>
      </header>

      <section
        style={{
          width: "100%",
          maxWidth: 1020,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 24,
          alignItems: "center",
          padding: "26px 24px",
          background: "rgba(11, 20, 17, 0.9)",
          border: "1px solid #223b32",
          borderRadius: 16,
          marginBottom: 44,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#6fe3c1", fontWeight: 800 }}>
            SURVEYOR TRAINING DECK · PRE-DEPLOYMENT
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(26px, 3.8vw, 38px)",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#f2fff9",
            }}
          >
            Something is still transmitting.
          </h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#9bc4b4" }}>
            Your Surveyor is warming up on the sub-level deck. Launch{" "}
            <strong style={{ color: "#e6f5ee" }}>The Signal Below</strong> to raid 100 2.6V floors,
            defeat guardians for Gold &amp; Gems, fuse duplicates (<strong style={{ color: "#eabfff" }}>3 → 9 → 27</strong>),
            and complete the <strong style={{ color: "#ffcf56" }}>105-Item Discovery Index</strong>.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 4,
              fontSize: 11,
            }}
          >
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: "#12241e",
                border: "1px solid #28473c",
                color: "#8de8cb",
              }}
            >
              SURVEYOR LV.{profile.level}
            </span>
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: "#12241e",
                border: "1px solid #28473c",
                color: "#8de8cb",
              }}
            >
              ATK {stats.totalAttack} · HP {stats.maxHealth}
            </span>
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: "#12241e",
                border: "1px solid #28473c",
                color: "#8de8cb",
              }}
            >
              DEEPEST FLOOR {String(profile.deepestFloor).padStart(2, "0")}
            </span>
            <span
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                background: "#1c1726",
                border: "1px solid #443366",
                color: "#d4a8ff",
                fontWeight: 700,
              }}
            >
              INDEX {profile.discoveredItems.length}/{FULL_ITEM_CATALOG.length}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <SurveyorWorkoutCanvas profile={profile} />
          <span style={{ fontSize: 11, color: "#6e9989" }}>
            Live pixel training loop · Reflects your equipped skin &amp; gear
          </span>
        </div>
      </section>

      <section
        id="featured-apps"
        style={{
          width: "100%",
          maxWidth: 1020,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, letterSpacing: 2, color: "#8de8cb" }}>
            ARCADE APPS · SELECT TO LAUNCH
          </h2>
          <span style={{ fontSize: 11, color: "#6e9989" }}>CLICK APP LOGO TO PLAY</span>
        </div>

        <div
          onClick={launchGame}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              launchGame();
            }
          }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 20,
            padding: 20,
            background: "linear-gradient(135deg, #0e1d18 0%, #122821 100%)",
            border: "2px solid #2e5447",
            borderRadius: 16,
            cursor: "pointer",
            boxShadow: "0 14px 34px rgba(0, 0, 0, 0.45)",
          }}
        >
          <SignalAppLogoTile />

          <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#f2fff9", letterSpacing: 1.5 }}>
                THE SIGNAL BELOW
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(111, 227, 193, 0.16)",
                  border: "1px solid #6fe3c1",
                  color: "#6fe3c1",
                  fontWeight: 800,
                }}
              >
                FLAGSHIP ARPG · v2.6
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: "#9bc4b4", lineHeight: 1.55 }}>
              2.6V subterranean extraction ARPG. Slay guardians for Gold &amp; Gems, upgrade permanent gear slots,
              merge duplicates (3 → 9 → 27), and collect all 105 items.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              launchGame();
            }}
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              border: "2px solid #9effdf",
              background: "#6fe3c1",
              color: "#06120e",
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: 1.2,
              cursor: "pointer",
            }}
          >
            OPEN APP ▶
          </button>
        </div>
      </section>
    </div>
  );
}
