import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowUpRight, Crosshair, Heart, Shield, Sparkles } from 'lucide-react';
import {
  createDeepSignalRun,
  extractWithLoot,
  riskLootAndContinue,
  ROOM_DEFINITIONS,
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
    const pointerUp = (event: MouseEvent) => {
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
        if (paintTick >= 32 || next.status !== current.status || next.message !== current.message) {
          setRun(next);
          paintTick = 0;
        }
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    if (run.status === 'escaped' || run.status === 'defeated') finishOnce(run.score);
  }, [run.status, run.score, finishOnce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawComplex(ctx, run);
  }, [run]);

  const startRun = () => {
    finishRef.current = false;
    inputRef.current = idleInput();
    keysRef.current.clear();
    replaceRun(startDeepSignalRun(runRef.current));
    setSaveNotice('');
  };
  const settleChoice = (choice: 'bank' | 'risk' | 'extract') => {
    const current = runRef.current;
    const next = choice === 'bank'
      ? secureLootAndContinue(current)
      : choice === 'risk'
        ? riskLootAndContinue(current)
        : extractWithLoot(current);
    replaceRun(next);
    if (choice !== 'risk') {
      const saved = saveBankedGear(next.bankedGear);
      setSaveNotice(saved ? 'Banked equipment saved on this device.' : 'Could not save equipment. Keep this tab open until the run ends.');
    } else setSaveNotice('');
  };
  const updateAim = (event: MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
    };
  };
  const currentRoom = ROOM_DEFINITIONS[run.roomIndex];
  const bankedCount = run.bankedGear.length;
  const carriedCount = run.carriedGear.length;

  return <section className="buried-game" data-testid="game-deep-signal">
    <header className="buried-hud" data-testid="status-game-hud">
      <div className="hud-room"><span className="signal-live" /> <div><small>COMPLEX / 0{run.roomIndex + 1}</small><strong data-testid="text-room-name">{currentRoom.name}</strong></div></div>
      <div className="hud-meters">
        <div className="meter health" aria-label="Health"><Heart size={15} /><span className="meter-track"><i style={{ width: `${Math.max(0, run.player.health / run.player.maxHealth * 100)}%` }} /></span><b data-testid="text-health">{Math.ceil(run.player.health)}</b></div>
        <div className="meter stamina" aria-label="Stamina"><Shield size={15} /><span className="meter-track"><i style={{ width: `${Math.max(0, run.player.stamina / run.player.maxStamina * 100)}%` }} /></span><b data-testid="text-stamina">{Math.ceil(run.player.stamina)}</b></div>
      </div>
      <div className="hud-score"><small>KILLS / SCORE</small><strong data-testid="text-run-score">{run.kills} <span>/</span> {run.score}</strong></div>
    </header>
    <div className="complex-stage">
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        aria-label={`${currentRoom.name} combat area`}
        data-testid="canvas-deep-signal"
        onMouseMove={updateAim}
        onMouseDown={(event) => {
          if (event.button === 0) inputRef.current.attack = true;
          if (event.button === 2) inputRef.current.guard = true;
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="stage-coordinate">SECTOR {String(run.roomIndex + 1).padStart(2, '0')} <span>·</span> SURVEY DEPTH 184 M</div>
      <div className="stage-message" data-testid="status-combat-message">{run.message}</div>
      {run.player.attackMs > 0 && <div className="action-flash" data-testid="status-attack-flash">CUTTER ACTIVE</div>}
      {run.player.guarding && <div className="action-flash guard-flash" data-testid="status-guard-flash">GUARD UP</div>}
      {run.player.dodgeMs > 0 && <div className="action-flash dodge-flash" data-testid="status-dodge-flash">EVADE</div>}
      {run.status === 'briefing' && <div className="game-overlay briefing-overlay" data-testid="panel-briefing">
        <div className="overlay-kicker"><span>FIELD RECORDING 01</span><span>REC <i /></span></div>
        <h2>THE SIGNAL<br /><em>BELOW</em></h2>
        <p>A surveyor vanished beneath the ridge. Their distress beacon is still transmitting. You enter the buried complex; the entrance seals behind you.</p>
        <div className="briefing-readout"><span>OBJECTIVE</span><b>FOLLOW THE BEACON. FIND A WAY OUT.</b></div>
        <button className="signal-button" onClick={startRun} data-testid="button-begin-descent">Begin descent <ArrowUpRight size={17} /></button>
      </div>}
      {run.status === 'safe-room' && <div className="game-overlay decision-overlay" data-testid="panel-safe-room">
        <div className="overlay-kicker"><span>RELAY ROOM / SAFE FOR NOW</span><span>HAUL {carriedCount}</span></div>
        <h2>Signal holds.</h2>
        <p>{currentRoom.signalNote} Take a moment. The next door goes deeper.</p>
        <div className="haul-row" data-testid="status-carried-loot"><span>UNSECURED HAUL</span><strong>{carriedCount} {carriedCount === 1 ? 'item' : 'items'}</strong></div>
        <div className="choice-actions">
          <button className="signal-button" onClick={() => settleChoice('bank')} data-testid="button-bank-continue"><b>01</b><span>Bank & continue<small>Secure the haul locally</small></span></button>
          <button className="signal-button secondary" onClick={() => settleChoice('risk')} data-testid="button-risk-continue"><b>02</b><span>Carry it deeper<small>Risk everything unbanked</small></span></button>
          {run.roomIndex === ROOM_DEFINITIONS.length - 1 && <button className="signal-button extract" onClick={() => settleChoice('extract')} data-testid="button-extract"><b>03</b><span>Extract with haul<small>Leave the complex now</small></span></button>}
        </div>
      </div>}
      {(run.status === 'escaped' || run.status === 'defeated') && <div className="game-overlay end-overlay" data-testid={`panel-${run.status}`}>
        <div className="overlay-kicker">{run.status === 'escaped' ? 'SIGNAL TRANSMITTED' : 'FIELD RECORDING LOST'}</div>
        <h2>{run.status === 'escaped' ? 'You made it out.' : 'The complex goes quiet.'}</h2>
        <p>{run.status === 'escaped' ? 'The beacon has an answer. Your secured equipment is waiting.' : `${run.lostGearCount} unbanked ${run.lostGearCount === 1 ? 'item was' : 'items were'} lost. Banked equipment remains safe.`}</p>
        <div className="end-score"><small>RUN SCORE</small><strong data-testid="text-final-score">{run.score}</strong><span>{run.kills} targets neutralized</span></div>
        <button className="signal-button" onClick={startRun} data-testid="button-retry-run">Enter again <ArrowUpRight size={17} /></button>
      </div>}
    </div>
    <div className="buried-lower">
      <div className="loot-panel" data-testid="status-loot-inventory">
        <div className="lower-heading"><span><Sparkles size={14} /> FIELD HAUL</span><span>{carriedCount} CARRIED / {bankedCount} BANKED</span></div>
        <div className="loot-items">
          {run.carriedGear.length ? run.carriedGear.map((item) => <span key={item.id} className={`loot-tag ${rarityClass(item.rarity)}`} data-testid={`item-carried-${item.id}`}><i />{item.name}<small>{item.rarity}</small></span>) : <span className="loot-empty">No unsecured gear. Clear the room for a chance at a drop.</span>}
        </div>
        <div className="equipped-strip" data-testid="status-equipped-gear"><b>BANKED LOADOUT</b>{(['weapon', 'shell', 'module'] as const).map((slot) => {
          const item = run.equippedGear[slot];
          return <span key={slot} className={item ? `equipped-item ${rarityClass(item.rarity)}` : 'equipped-item empty'}><small>{slot}</small>{item?.name ?? '—'}</span>;
        })}</div>
        <div className="banked-storage" data-testid="status-banked-equipment"><b>BANKED EQUIPMENT</b>
          {run.bankedGear.length ? run.bankedGear.map((item) => <span key={item.id} className={rarityClass(item.rarity)} data-testid={`item-banked-${item.id}`}>{item.name}</span>) : <span className="banked-empty">Nothing secured yet.</span>}
        </div>
      </div>
      <div className="control-panel" data-testid="status-controls">
        <div className="lower-heading"><span><Crosshair size={14} /> FIELD CONTROLS</span><span>KEYBOARD + MOUSE</span></div>
        <div className="control-list">
          <span><kbd>W A S D</kbd> Move</span><span><kbd>J</kbd> / <kbd>Left click</kbd> Swing</span><span><kbd>K</kbd> / <kbd>Right click</kbd> Guard</span><span><kbd>Space</kbd> Dodge</span><span><kbd>E</kbd> Relay door</span>
        </div>
      </div>
    </div>
    <div className="buried-footnote" data-testid="status-run-note">
      <span>{run.roomCleared && run.status === 'playing' ? 'Room clear. Move to the lit relay door and press E.' : 'Watch for a wind-up flash, then guard or dodge before impact.'}</span>
      <span>{saveNotice && <span role="status" data-testid="status-save-result">{saveNotice} · </span>}LOCAL RUN · {run.bankedGear.length} SECURED</span>
    </div>
  </section>;
}

function drawComplex(ctx: CanvasRenderingContext2D, run: DeepSignalRun) {
  const room = ROOM_DEFINITIONS[run.roomIndex];
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = '#17201f';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = '#202a27';
  ctx.fillRect(18, 18, WORLD_WIDTH - 36, WORLD_HEIGHT - 36);
  // Modular concrete floor grid and worn survey markings.
  for (let x = 32; x < WORLD_WIDTH - 20; x += 32) {
    ctx.fillStyle = x % 128 === 0 ? '#2c3731' : '#26312d';
    ctx.fillRect(x, 20, 1, WORLD_HEIGHT - 40);
  }
  for (let y = 32; y < WORLD_HEIGHT - 20; y += 32) {
    ctx.fillStyle = y % 128 === 0 ? '#2c3731' : '#26312d';
    ctx.fillRect(20, y, WORLD_WIDTH - 40, 1);
  }
  ctx.strokeStyle = '#71806a';
  ctx.lineWidth = 2;
  ctx.strokeRect(19, 19, WORLD_WIDTH - 38, WORLD_HEIGHT - 38);
  ctx.strokeStyle = '#566257';
  ctx.setLineDash([5, 7]);
  ctx.beginPath(); ctx.moveTo(48, 210); ctx.lineTo(666, 210); ctx.stroke(); ctx.setLineDash([]);

  for (const block of room.blockers) {
    ctx.fillStyle = '#111918'; ctx.fillRect(block.x + 5, block.y + 7, block.width, block.height);
    ctx.fillStyle = block.kind === 'console' ? '#49564d' : block.kind === 'crate' ? '#5a4936' : '#667066';
    ctx.fillRect(block.x, block.y, block.width, block.height);
    ctx.fillStyle = '#88907c'; ctx.fillRect(block.x, block.y, block.width, 5);
    ctx.fillStyle = '#303b35'; ctx.fillRect(block.x + 5, block.y + 9, block.width - 10, 3);
    if (block.kind === 'console') {
      ctx.fillStyle = '#d8aa58'; ctx.fillRect(block.x + block.width / 2 - 3, block.y + 18, 6, 12);
      ctx.fillStyle = '#79b3a0'; ctx.fillRect(block.x + 12, block.y + 39, block.width - 24, 3);
    }
  }

  // Door remains visually legible before the player reaches it.
  const doorX = WORLD_WIDTH - 60; const doorY = WORLD_HEIGHT / 2 - 34;
  ctx.fillStyle = '#111615'; ctx.fillRect(doorX - 9, doorY - 9, 38, 86);
  ctx.fillStyle = run.roomCleared ? '#c2944e' : '#4c5c54';
  ctx.fillRect(doorX, doorY, 20, 68);
  ctx.fillStyle = run.roomCleared ? '#f0c86c' : '#728078';
  ctx.fillRect(doorX + 5, doorY + 8, 10, 3);
  ctx.fillRect(doorX + 5, doorY + 19, 10, 3);
  ctx.fillRect(doorX + 5, doorY + 30, 10, 3);
  ctx.fillStyle = run.roomCleared ? '#f1cc72' : '#91a294';
  ctx.fillRect(doorX - 2, doorY - 18, 24, 4);
  ctx.font = '10px monospace'; ctx.fillText(run.roomCleared ? 'E / OPEN' : 'SEALED', doorX - 11, doorY + 84);

  for (const pickup of run.pickups) {
    const color = pickup.item.rarity === 'Legendary' ? '#f0d16e' : pickup.item.rarity === 'Epic' ? '#cb8cdf' : pickup.item.rarity === 'Rare' ? '#78b6dc' : pickup.item.rarity === 'Uncommon' ? '#8ec99b' : '#c4c8b4';
    ctx.fillStyle = `${color}33`; ctx.fillRect(pickup.x - 12, pickup.y - 12, 24, 24);
    ctx.fillStyle = color; ctx.fillRect(pickup.x - 5, pickup.y - 5, 10, 10);
    ctx.fillStyle = '#f0e8d2'; ctx.fillRect(pickup.x - 2, pickup.y - 2, 4, 4);
  }

  for (const enemy of run.enemies) {
    if (enemy.health <= 0) continue;
    const windup = enemy.windupMs > 0;
    ctx.fillStyle = windup ? '#d8624f' : '#b45f4d';
    if (windup) { ctx.fillRect(enemy.x - 20, enemy.y - 24, 40, 3); ctx.fillRect(enemy.x - 20, enemy.y - 24, 40 * Math.min(1, enemy.windupMs / 700), 3); }
    ctx.fillStyle = '#111817'; ctx.fillRect(enemy.x - 12, enemy.y - 8, 24, 24);
    ctx.fillStyle = enemy.kind === 'warden' ? '#8e5148' : '#b96b53';
    ctx.fillRect(enemy.x - 10, enemy.y - 12, 20, 20);
    ctx.fillStyle = '#e3c17a';
    ctx.fillRect(enemy.x - 6, enemy.y - 5, 4, 3); ctx.fillRect(enemy.x + 3, enemy.y - 5, 4, 3);
    ctx.fillStyle = '#111817'; ctx.fillRect(enemy.x - 14, enemy.y - 20, 28, 3);
    ctx.fillStyle = '#cf7460'; ctx.fillRect(enemy.x - 13, enemy.y - 19, 26 * (enemy.health / enemy.maxHealth), 1);
  }
  // Tiny explorer with a deliberate shadow and an aim-facing cutter.
  const p = run.player;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(p.x - 11, p.y + 10, 23, 6);
  const body = p.invulnerableMs > 0 ? '#f2d180' : '#7ca998';
  ctx.fillStyle = '#151d1c'; ctx.fillRect(p.x - 9, p.y - 13, 18, 25);
  ctx.fillStyle = body; ctx.fillRect(p.x - 8, p.y - 14, 16, 20);
  ctx.fillStyle = '#b5c1a2'; ctx.fillRect(p.x - 6, p.y - 10, 12, 4);
  ctx.fillStyle = '#293631'; ctx.fillRect(p.x - 6, p.y + 5, 5, 7); ctx.fillRect(p.x + 2, p.y + 5, 5, 7);
  ctx.strokeStyle = p.guarding ? '#e6c977' : '#d9d1b0'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(p.x + p.facingX * 7, p.y + p.facingY * 7); ctx.lineTo(p.x + p.facingX * 27, p.y + p.facingY * 27); ctx.stroke();
  if (p.attackMs > 0) {
    ctx.strokeStyle = '#f3d27a'; ctx.lineWidth = 4; ctx.beginPath();
    ctx.arc(p.x, p.y, 35, Math.atan2(p.facingY, p.facingX) - .65, Math.atan2(p.facingY, p.facingX) + .65); ctx.stroke();
  }
  if (p.guarding) { ctx.strokeStyle = 'rgba(227,201,120,.75)'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 18, p.y - 22, 36, 42); }
}
