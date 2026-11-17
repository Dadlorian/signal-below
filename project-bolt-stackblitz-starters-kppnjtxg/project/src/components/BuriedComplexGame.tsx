import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowUpRight, Crosshair, Heart, Shield, Sparkles, Zap } from 'lucide-react';
import {
  continueOverdriveAfterEnding,
  createDeepSignalRun,
  extractWithLoot,
  FINAL_BOSS_FLOOR,
  riskLootAndContinue,
  secureLootAndContinue,
  startDeepSignalRun,
  stepDeepSignalRun,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type DeepSignalRun,
  type GearItem,
  type PlayerInput,
} from '../lib/deep-signal-engine';
import { loadBankedGear, saveBankedGear } from '../lib/deep-signal-store';
import './BuriedComplexGame.css';

type Props = { onFinish: (score: number) => void };
const idleInput = (): PlayerInput => ({
  moveX: 0, moveY: 0, lookX: 1, lookY: 0, attack: false, guard: false, dodge: false, interact: false,
});
const rarityClass = (rarity: GearItem['rarity']) => rarity.toLowerCase();

function shadeColor(hex: string, percent: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}

// True 3D-projected Isometric Box Renderer (Zero external dependencies!)
function draw3DBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  color: string,
  glow?: string,
) {
  const tilt = 0.72;
  const sy = y * tilt + 62;
  const sh = d * tilt;

  // Ground drop shadow
  ctx.fillStyle = 'rgba(5, 9, 9, 0.52)';
  ctx.fillRect(x + 8, sy + 6, w, sh);

  // Front 3D extruded wall face
  ctx.fillStyle = shadeColor(color, -26);
  ctx.fillRect(x, sy + sh - h, w, h);

  // Right bevel edge for 3D depth
  ctx.fillStyle = shadeColor(color, -38);
  ctx.beginPath();
  ctx.moveTo(x + w, sy - h);
  ctx.lineTo(x + w + 5, sy - h + 4);
  ctx.lineTo(x + w + 5, sy + sh + 4);
  ctx.lineTo(x + w, sy + sh);
  ctx.closePath();
  ctx.fill();

  // Top 3D surface
  ctx.fillStyle = color;
  ctx.fillRect(x, sy - h, w, sh);

  // Top rim highlight
  ctx.strokeStyle = glow ?? shadeColor(color, 22);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, sy - h + 0.5, w - 1, sh - 1);
}

function render3DComplex(ctx: CanvasRenderingContext2D, run: DeepSignalRun, now: number) {
  const room = run.currentRoom;
  const tilt = 0.72;
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Deep underground void backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  bg.addColorStop(0, '#0d1413');
  bg.addColorStop(1, '#182220');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Back 3D Bunker Wall
  ctx.fillStyle = '#293531';
  ctx.fillRect(18, 26, WORLD_WIDTH - 36, 48);
  ctx.fillStyle = '#475750';
  ctx.fillRect(18, 24, WORLD_WIDTH - 36, 4);

  // Angled 3D Floor Slab
  const floorTop = 18 * tilt + 62;
  const floorHeight = (WORLD_HEIGHT - 36) * tilt;
  ctx.fillStyle = '#101716';
  ctx.fillRect(18, floorTop + floorHeight, WORLD_WIDTH - 36, 14);
  ctx.fillStyle = '#202b28';
  ctx.fillRect(18, floorTop, WORLD_WIDTH - 36, floorHeight);

  // 3D Perspective Grid Tiles
  ctx.strokeStyle = '#2b3833';
  ctx.lineWidth = 1;
  for (let gx = 32; gx < WORLD_WIDTH - 20; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, floorTop);
    ctx.lineTo(gx, floorTop + floorHeight);
    ctx.stroke();
  }
  for (let gy = 32; gy < WORLD_HEIGHT - 20; gy += 32) {
    const py = gy * tilt + 62;
    ctx.beginPath();
    ctx.moveTo(18, py);
    ctx.lineTo(WORLD_WIDTH - 18, py);
    ctx.stroke();
  }

  // 3D Relay Exit Gate on Right Wall
  const doorY = WORLD_HEIGHT / 2 - 34;
  draw3DBox(
    ctx,
    WORLD_WIDTH - 58,
    doorY,
    22,
    68,
    38,
    run.roomCleared ? '#d9a441' : '#3d4c45',
    run.roomCleared ? '#ffe38f' : '#65756d',
  );
  ctx.fillStyle = run.roomCleared ? '#ffe38f' : '#8ea095';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(run.roomCleared ? 'EXIT OPEN' : 'LOCKED', WORLD_WIDTH - 68, doorY * tilt + 20);

  // Depth-sort all 3D objects (walls, loot, enemies, player) from back to front!
  type RenderItem = { sortY: number; draw: () => void };
  const renderList: RenderItem[] = [];

  for (const block of room.blockers) {
    renderList.push({
      sortY: block.y + block.height,
      draw: () => {
        const h = block.kind === 'pillar' ? 36 : block.kind === 'console' ? 24 : 20;
        const col = block.kind === 'console' ? '#4a5c53' : block.kind === 'crate' ? '#6e5239' : '#636f65';
        draw3DBox(ctx, block.x, block.y, block.width, block.height, h, col);
        if (block.kind === 'console') {
          const sy = block.y * tilt + 62 - h;
          ctx.fillStyle = '#6fe3c1';
          ctx.fillRect(block.x + 10, sy + 6, block.width - 20, 4);
        }
      },
    });
  }

  for (const pickup of run.pickups) {
    renderList.push({
      sortY: pickup.y,
      draw: () => {
        const col = pickup.item.rarity === 'Legendary' ? '#f5d469'
          : pickup.item.rarity === 'Epic' ? '#d18ce8'
          : pickup.item.rarity === 'Rare' ? '#6eb9eb'
          : pickup.item.rarity === 'Uncommon' ? '#85d198' : '#c9cdb8';
        const bob = Math.sin(now * 0.007) * 4;
        draw3DBox(ctx, pickup.x - 7, pickup.y - 7, 14, 14, 14 + bob, col, '#ffffff');
      },
    });
  }

  for (const enemy of run.enemies) {
    if (enemy.health <= 0) continue;
    renderList.push({
      sortY: enemy.y + 10,
      draw: () => {
        const isBoss = enemy.kind === 'boss';
        const isWarden = enemy.kind === 'warden';
        const w = isBoss ? 44 : isWarden ? 26 : 20;
        const d = isBoss ? 38 : isWarden ? 22 : 18;
        const h = isBoss ? 46 : isWarden ? 30 : 22;
        const col = enemy.windupMs > 0 ? '#ff5938' : isBoss ? '#a8322d' : isWarden ? '#914f45' : '#bd674f';
        draw3DBox(ctx, enemy.x - w / 2, enemy.y - d / 2, w, d, h, col, enemy.windupMs > 0 ? '#ffd166' : undefined);

        // Glowing 3D Visor
        const sy = (enemy.y - d / 2) * tilt + 62 - h + 6;
        ctx.fillStyle = '#ffe082';
        ctx.fillRect(enemy.x - w * 0.28 + enemy.facingX * 4, sy, w * 0.56, 4);

        // Floating 3D Health Bar
        ctx.fillStyle = '#0f1615';
        ctx.fillRect(enemy.x - w / 2, sy - 11, w, 4);
        ctx.fillStyle = isBoss ? '#ff5938' : '#e07a5f';
        ctx.fillRect(enemy.x - w / 2 + 1, sy - 10, (w - 2) * Math.max(0, enemy.health / enemy.maxHealth), 2);
      },
    });
  }

  // Player 3D Surveyor Character
  const p = run.player;
  renderList.push({
    sortY: p.y + 10,
    draw: () => {
      const bodyCol = p.invulnerableMs > 0 ? '#f5d684' : '#72ab97';
      draw3DBox(ctx, p.x - 10, p.y - 9, 20, 18, 25, bodyCol, '#b8e3d2');
      const sy = p.y * tilt + 62 - 16;

      // Glowing 3D Plasma Cutter Blade
      ctx.strokeStyle = p.guarding ? '#f5d469' : '#e8f5f0';
      ctx.lineWidth = p.attackMs > 0 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(p.x + p.facingX * 8, sy + p.facingY * 6);
      ctx.lineTo(p.x + p.facingX * 30, sy + p.facingY * 22);
      ctx.stroke();

      if (p.attackMs > 0) {
        const angle = Math.atan2(p.facingY * tilt, p.facingX);
        ctx.strokeStyle = 'rgba(245, 212, 105, 0.85)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.x, sy, 38, angle - 0.75, angle + 0.75);
        ctx.stroke();
      }
      if (p.guarding) {
        ctx.strokeStyle = 'rgba(245, 212, 105, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(p.x - 18, sy - 14, 36, 30);
      }
    },
  });

  renderList.sort((a, b) => a.sortY - b.sortY);
  for (const item of renderList) item.draw();

  // Front Perimeter Wall
  ctx.fillStyle = '#33403b';
  ctx.fillRect(18, floorTop + floorHeight - 6, WORLD_WIDTH - 36, 12);
}
export function BuriedComplexGame({ onFinish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<PlayerInput>(idleInput());
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const runRef = useRef<DeepSignalRun>(createDeepSignalRun(loadBankedGear()));
  const finishRef = useRef(false);
  const frameRef = useRef<number>(0);
  const [run, setRun] = useState(runRef.current);
  const [saveNotice, setSaveNotice] = useState('');

  const replaceRun = useCallback((next: DeepSignalRun) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const finishOnce = useCallback((score: number) => {
    if (finishRef.current) return;
    finishRef.current = true;
    onFinish(score);
  }, [onFinish]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      keysRef.current.add(key);
      if (key === 'j') inputRef.current.attack = true;
      if (key === 'k') inputRef.current.guard = true;
      if (key === ' ') inputRef.current.dodge = true;
      if (key === 'e') inputRef.current.interact = true;
    };
    const keyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current.delete(key);
      if (key === 'j') inputRef.current.attack = false;
      if (key === 'k') inputRef.current.guard = false;
      if (key === ' ') inputRef.current.dodge = false;
      if (key === 'e') inputRef.current.interact = false;
    };
    const pointerUp = (event: globalThis.MouseEvent) => {
      if (event.button === 0) inputRef.current.attack = false;
      if (event.button === 2) inputRef.current.guard = false;
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('mouseup', pointerUp);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('mouseup', pointerUp);
    };
  }, []);

  useEffect(() => {
    let last = performance.now();
    let paintTick = 0;

    const loop = (now: number) => {
      const delta = Math.min(now - last, 50);
      last = now;
      const current = runRef.current;

      if (current.status === 'playing') {
        const keys = keysRef.current;
        const moveX = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
        const moveY = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
        const lookX = mouseRef.current ? mouseRef.current.x - current.player.x : current.player.facingX;
        const lookY = mouseRef.current ? mouseRef.current.y - current.player.y : current.player.facingY;
        const next = stepDeepSignalRun(current, {
          ...inputRef.current,
          moveX,
          moveY,
          lookX: lookX / (Math.hypot(lookX, lookY) || 1),
          lookY: lookY / (Math.hypot(lookX, lookY) || 1),
        }, delta);
        runRef.current = next;
        paintTick += delta;
        if (paintTick >= 40 || next.status !== current.status || next.message !== current.message) {
          setRun(next);
          paintTick = 0;
        }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        render3DComplex(ctx, runRef.current, now);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    if (run.status === 'escaped' || run.status === 'defeated') finishOnce(run.score);
  }, [run.status, run.score, finishOnce]);

  const startRun = () => {
    finishRef.current = false;
    inputRef.current = idleInput();
    keysRef.current.clear();
    replaceRun(startDeepSignalRun(runRef.current));
    setSaveNotice('');
  };

  const settleChoice = (choice: 'bank' | 'risk' | 'extract' | 'overdrive') => {
    const current = runRef.current;
    const next = choice === 'bank'
      ? secureLootAndContinue(current)
      : choice === 'risk'
        ? riskLootAndContinue(current)
        : choice === 'overdrive'
          ? continueOverdriveAfterEnding(current)
          : extractWithLoot(current);
    replaceRun(next);
    if (choice !== 'risk') {
      const saved = saveBankedGear(next.bankedGear);
      setSaveNotice(saved ? 'Equipment & progress saved on this device.' : 'Keep this tab open to preserve run.');
    } else setSaveNotice('');
  };

  const updateAim = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const rawY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    mouseRef.current = {
      x: rawX,
      y: Math.max(0, Math.min(WORLD_HEIGHT, (rawY - 62) / 0.72)),
    };
  };

  const activeBoss = run.enemies.find((e) => e.kind === 'boss' && e.health > 0);
  const bankedCount = run.bankedGear.length;
  const carriedCount = run.carriedGear.length;
  const floorNumber = run.roomIndex + 1;

  return <section className="buried-game" data-testid="game-deep-signal">
    <header className="buried-hud" data-testid="status-game-hud">
      <div className="hud-room">
        <span className="signal-live" />
        <div>
          <small>FLOOR {String(floorNumber).padStart(2, '0')} / {FINAL_BOSS_FLOOR} · LV.{run.player.level}</small>
          <strong data-testid="text-room-name">{run.currentRoom.name}</strong>
        </div>
      </div>
      <div className="hud-meters">
        <div className="meter health" aria-label="Health">
          <Heart size={15} />
          <span className="meter-track"><i style={{ width: Math.max(0, run.player.health / run.player.maxHealth * 100) + '%' }} /></span>
          <b data-testid="text-health">{Math.ceil(run.player.health)}</b>
        </div>
        <div className="meter stamina" aria-label="Stamina">
          <Shield size={15} />
          <span className="meter-track"><i style={{ width: Math.max(0, run.player.stamina / run.player.maxStamina * 100) + '%' }} /></span>
          <b data-testid="text-stamina">{Math.ceil(run.player.stamina)}</b>
        </div>
        <div className="meter" aria-label="XP">
          <Zap size={15} />
          <span className="meter-track"><i style={{ width: Math.min(100, run.player.xp / run.player.xpToNext * 100) + '%', background: '#f0c86c' }} /></span>
          <b>LV{run.player.level}</b>
        </div>
      </div>
      <div className="hud-score">
        <small>KILLS / SCORE</small>
        <strong data-testid="text-run-score">{run.kills} <span>/</span> {run.score}</strong>
      </div>
    </header>

    {activeBoss && run.status === 'playing' && (
      <div style={{ background: '#2a1514', border: '1px solid #d8624f', padding: '6px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
        <strong style={{ color: '#ff8a75', fontSize: 12, letterSpacing: '0.08em' }}>
          {run.currentRoom.isFinalBoss ? 'FINAL BOSS: SIGNAL SOVEREIGN' : 'SECTOR GUARDIAN BOSS'}
        </strong>
        <div style={{ flex: 1, height: 8, background: '#140a0a', overflow: 'hidden' }}>
          <div style={{ width: Math.max(0, activeBoss.health / activeBoss.maxHealth * 100) + '%', height: '100%', background: '#ff5938' }} />
        </div>
        <span style={{ color: '#ffd2c9', fontSize: 12, fontFamily: 'monospace' }}>{activeBoss.health} / {activeBoss.maxHealth}</span>
      </div>
    )}

    <div className="complex-stage">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        aria-label={run.currentRoom.name + ' 3D combat area'}
        data-testid="canvas-deep-signal"
        onMouseMove={updateAim}
        onMouseDown={(event) => {
          if (event.button === 0) inputRef.current.attack = true;
          if (event.button === 2) inputRef.current.guard = true;
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="stage-coordinate">
        3D SECTOR {String(floorNumber).padStart(2, '0')} <span>·</span> DEPTH {180 + floorNumber * 12} M <span>·</span> ATK {30 + run.player.bonusAttack + (run.equippedGear.weapon?.attackBonus ?? 0)}
      </div>
      <div className="stage-message" data-testid="status-combat-message">{run.message}</div>
      {run.player.attackMs > 0 && <div className="action-flash" data-testid="status-attack-flash">CUTTER ACTIVE</div>}
      {run.player.guarding && <div className="action-flash guard-flash" data-testid="status-guard-flash">GUARD UP</div>}
      {run.player.dodgeMs > 0 && <div className="action-flash dodge-flash" data-testid="status-dodge-flash">EVADE</div>}

      {run.status === 'briefing' && <div className="game-overlay briefing-overlay" data-testid="panel-briefing">
        <div className="overlay-kicker"><span>3D ACTION-RPG EXPEDITION</span><span>100 FLOORS <i /></span></div>
        <h2>THE SIGNAL<br /><em>BELOW</em></h2>
        <p>Descend through 100 procedural 3D floors, level up your stats, auto-equip stronger gear, and defeat the Signal Sovereign on Floor 100.</p>
        <div className="briefing-readout"><span>OBJECTIVE</span><b>REACH FLOOR 100 & DEFEAT THE FINAL BOSS</b></div>
        <button className="signal-button" onClick={startRun} data-testid="button-begin-descent">Begin 3D descent <ArrowUpRight size={17} /></button>
      </div>}

      {run.status === 'safe-room' && <div className="game-overlay decision-overlay" data-testid="panel-safe-room">
        <div className="overlay-kicker"><span>RELAY CHECKPOINT · FLOOR {floorNumber}</span><span>HAUL {carriedCount}</span></div>
        <h2>Signal holds.</h2>        <p>{run.currentRoom.signalNote} Secure your gear now or risk carrying it deeper.</p>
        <div className="haul-row" data-testid="status-carried-loot"><span>UNSECURED HAUL</span><strong>{carriedCount} {carriedCount === 1 ? 'item' : 'items'}</strong></div>
        <div className="choice-actions">
          <button className="signal-button" onClick={() => settleChoice('bank')} data-testid="button-bank-continue"><b>01</b><span>Bank & continue<small>Save gear & go to Floor {floorNumber + 1}</small></span></button>
          <button className="signal-button secondary" onClick={() => settleChoice('risk')} data-testid="button-risk-continue"><b>02</b><span>Carry it deeper<small>Keep pushing without banking</small></span></button>
          <button className="signal-button extract" onClick={() => settleChoice('extract')} data-testid="button-extract"><b>03</b><span>Extract now<small>End run & keep all gear</small></span></button>
        </div>
      </div>}

      {run.status === 'victory-ending' && <div className="game-overlay decision-overlay" data-testid="panel-victory-ending">
        <div className="overlay-kicker"><span>FLOOR 100 CLEARED · ENDING UNLOCKED</span><span>LV.{run.player.level}</span></div>
        <h2>Signal Decoded.</h2>
        <p>You defeated the Signal Sovereign at the bottom of the complex. Complete your expedition now—or enter Endless Overdrive to fight stronger bosses beyond Floor 100!</p>
        <div className="end-score"><small>VICTORY SCORE</small><strong>{run.score}</strong><span>{run.kills} targets neutralized</span></div>
        <div className="choice-actions">
          <button className="signal-button" onClick={() => settleChoice('overdrive')} data-testid="button-overdrive"><b>01</b><span>Continue Deeper (Overdrive)<small>Keep leveling up & fight Floor 101+ bosses</small></span></button>
          <button className="signal-button extract" onClick={() => settleChoice('extract')} data-testid="button-finish-ending"><b>02</b><span>Complete Expedition<small>Finish story & save victory score</small></span></button>
        </div>
      </div>}

      {(run.status === 'escaped' || run.status === 'defeated') && <div className="game-overlay end-overlay" data-testid={'panel-' + run.status}>
        <div className="overlay-kicker">{run.status === 'escaped' ? 'EXPEDITION COMPLETE' : 'SIGNAL LOST ON FLOOR ' + floorNumber}</div>
        <h2>{run.status === 'escaped' ? 'You made it out.' : 'The complex goes quiet.'}</h2>
        <p>{run.status === 'escaped' ? 'Your banked gear and victory record are saved locally.' : run.lostGearCount + ' unbanked items were lost. Banked equipment remains safe.'}</p>
        <div className="end-score"><small>FINAL SCORE · FLOOR {floorNumber}</small><strong data-testid="text-final-score">{run.score}</strong><span>LV.{run.player.level} · {run.kills} targets neutralized</span></div>
        <button className="signal-button" onClick={startRun} data-testid="button-retry-run">Enter again <ArrowUpRight size={17} /></button>
      </div>}
    </div>

    <div className="buried-lower">
      <div className="loot-panel" data-testid="status-loot-inventory">
        <div className="lower-heading"><span><Sparkles size={14} /> AUTO-EQUIPPED LOADOUT</span><span>LV.{run.player.level} · {bankedCount} BANKED</span></div>
        <div className="equipped-strip" data-testid="status-equipped-gear"><b>ACTIVE GEAR</b>{(['weapon', 'shell', 'module'] as const).map((slot) => {
          const item = run.equippedGear[slot];
          return <span key={slot} className={item ? 'equipped-item ' + rarityClass(item.rarity) : 'equipped-item empty'}><small>{slot}</small>{item?.name ?? '—'}</span>;
        })}</div>
        <div className="loot-items">
          {run.carriedGear.length ? run.carriedGear.slice(-5).map((item) => <span key={item.id} className={'loot-tag ' + rarityClass(item.rarity)}><i />{item.name}<small>{item.rarity}</small></span>) : <span className="loot-empty">Defeat enemies to drop & auto-equip stronger gear.</span>}
        </div>
      </div>
      <div className="control-panel" data-testid="status-controls">
        <div className="lower-heading"><span><Crosshair size={14} /> FIELD CONTROLS</span><span>3D ACTION-RPG</span></div>
        <div className="control-list">
          <span><kbd>W A S D</kbd> Move</span><span><kbd>Left click</kbd> / <kbd>J</kbd> Slash</span><span><kbd>Right click</kbd> / <kbd>K</kbd> Guard</span><span><kbd>Space</kbd> Dodge</span><span>Walk to lit door when clear</span>
        </div>
      </div>
    </div>
    <div className="buried-footnote" data-testid="status-run-note">
      <span>{run.roomCleared && run.status === 'playing' ? 'Floor clear! Walk into the glowing gold relay door on the right to advance.' : 'Clear all targets to unlock the relay door. Bosses appear every 10 floors!'}</span>
      <span>{saveNotice && <span role="status">{saveNotice} · </span>}FLOOR {floorNumber} / {FINAL_BOSS_FLOOR}</span>
    </div>
  </section>;
}

