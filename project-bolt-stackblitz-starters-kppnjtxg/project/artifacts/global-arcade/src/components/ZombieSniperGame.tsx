import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Crosshair, RotateCcw, Shield, Target, Zap } from 'lucide-react';
import {
  advanceZombieSniperRun,
  createZombieSniperState,
  requestZombieReload,
  shootZombieTarget,
  startZombieSniperRun,
  type ZombieSniperState,
  type ZombieTarget,
} from '../lib/zombie-sniper-engine';

type ZombieSniperGameProps = { onFinish: (score: number) => void };

function Zombie({ target, onShoot }: { target: ZombieTarget; onShoot: (id: number | null, part: 'head' | 'body') => void }) {
  const scale = target.size;
  return <group position={[target.x, 0, target.z]} scale={scale}>
    <group rotation={[0, 0, target.direction === 1 ? -0.06 : 0.06]}>
      <mesh position={[0, 1.12, 0]} onPointerDown={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onShoot(target.id, 'body'); }}>
        <boxGeometry args={[0.82, 1.02, 0.44]} />
        <meshStandardMaterial color="#546c60" roughness={0.94} />
      </mesh>
      <mesh position={[-0.62, 1.1, 0]} rotation={[0, 0, -0.14]} onPointerDown={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onShoot(target.id, 'body'); }}>
        <boxGeometry args={[0.27, 0.9, 0.3]} />
        <meshStandardMaterial color="#41594f" roughness={0.9} />
      </mesh>
      <mesh position={[0.62, 1.1, 0]} rotation={[0, 0, 0.14]} onPointerDown={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onShoot(target.id, 'body'); }}>
        <boxGeometry args={[0.27, 0.9, 0.3]} />
        <meshStandardMaterial color="#41594f" roughness={0.9} />
      </mesh>
      <mesh position={[-0.23, 0.2, 0]} rotation={[0, 0, -0.04]}><boxGeometry args={[0.3, 0.85, 0.34]} /><meshStandardMaterial color="#36433e" /></mesh>
      <mesh position={[0.23, 0.2, 0]} rotation={[0, 0, 0.04]}><boxGeometry args={[0.3, 0.85, 0.34]} /><meshStandardMaterial color="#36433e" /></mesh>
      <mesh position={[0, 1.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.2, 0.28, 8]} />
        <meshStandardMaterial color="#81917a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.1, 0]} onPointerDown={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onShoot(target.id, 'head'); }}>
        <sphereGeometry args={[0.39, 12, 10]} />
        <meshStandardMaterial color="#9a9c78" roughness={0.92} />
      </mesh>
      <mesh position={[-0.14, 2.13, 0.345]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color="#e8bd64" />
      </mesh>
      <mesh position={[0.14, 2.13, 0.345]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshBasicMaterial color="#e8bd64" />
      </mesh>
      <mesh position={[0, 1.94, 0.37]}>
        <boxGeometry args={[0.18, 0.035, 0.025]} />
        <meshStandardMaterial color="#40493e" />
      </mesh>
    </group>
  </group>;
}

function NightRange({ state, onShoot }: { state: ZombieSniperState; onShoot: (id: number | null, part: 'head' | 'body') => void }) {
  const miss = (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onShoot(null, 'body'); };
  return <>
    <color attach="background" args={['#111a22']} />
    <fog attach="fog" args={['#111a22', 17, 39]} />
    <ambientLight intensity={1.05} color="#91a7a0" />
    <directionalLight position={[-5, 9, 3]} intensity={2.3} color="#e2c991" />
    <pointLight position={[5, 5, -10]} intensity={22} color="#d97455" distance={24} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, -9]} receiveShadow onPointerDown={miss}>
      <planeGeometry args={[80, 60]} />
      <meshStandardMaterial color="#26332f" roughness={1} />
    </mesh>
    <gridHelper args={[42, 28, '#52615a', '#35433f']} position={[0, -0.23, -8]} onPointerDown={miss} />
    <mesh position={[0, 5.8, -24]} onPointerDown={miss}>
      <sphereGeometry args={[2.2, 20, 16]} />
      <meshBasicMaterial color="#d2a75e" />
    </mesh>
    <mesh position={[-11, 1.7, -19]} onPointerDown={miss}><boxGeometry args={[9, 4, 2]} /><meshStandardMaterial color="#253035" /></mesh>
    <mesh position={[10, 2.1, -21]} onPointerDown={miss}><boxGeometry args={[11, 5, 2]} /><meshStandardMaterial color="#202c32" /></mesh>
    <mesh position={[-4, 3.2, -25]} onPointerDown={miss}><boxGeometry args={[4, 8, 2]} /><meshStandardMaterial color="#1c282e" /></mesh>
    <mesh position={[4, 2.7, -24]} onPointerDown={miss}><boxGeometry args={[3.5, 7, 2]} /><meshStandardMaterial color="#1b272d" /></mesh>
    {state.targets.map((target) => <Zombie key={target.id} target={target} onShoot={onShoot} />)}
  </>;
}

function SniperTicker({ advance }: { advance: (delta: number) => void }) {
  useFrame((_, delta) => advance(delta * 1000));
  return null;
}

export function ZombieSniperGame({ onFinish }: ZombieSniperGameProps) {
  const stateRef = useRef<ZombieSniperState>(createZombieSniperState());
  const [view, setView] = useState<ZombieSniperState>(stateRef.current);
  const finishNotified = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const refresh = useCallback(() => setView({ ...stateRef.current, targets: [...stateRef.current.targets] }), []);
  const advance = useCallback((delta: number) => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;
    stateRef.current = advanceZombieSniperRun(current, delta);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refresh, 90);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (view.status === 'over' && !finishNotified.current) {
      finishNotified.current = true;
      onFinishRef.current(view.score);
    }
  }, [view.status, view.score]);

  const start = () => {
    finishNotified.current = false;
    stateRef.current = startZombieSniperRun();
    refresh();
  };
  const shoot = (targetId: number | null, part: 'head' | 'body') => {
    const shot = shootZombieTarget(stateRef.current, targetId, part);
    stateRef.current = shot.state;
    refresh();
  };
  const reload = () => {
    stateRef.current = requestZombieReload(stateRef.current);
    refresh();
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return;
      if ((event.target as HTMLElement | null)?.matches('input, textarea, button')) return;
      event.preventDefault();
      reload();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const remaining = view.maxAmmo - view.ammo;
  const reloadProgress = view.reloading ? Math.max(0, 1 - view.reloadRemainingMs / 950) : 0;
  return <div className="sniper-game" data-testid="game-board-sniper">
    <div className="sniper-hud">
      <div className="sniper-stat"><span className="sniper-stat-label"><Target size={14} /> SCORE</span><strong data-testid="text-sniper-score">{view.score.toLocaleString()}</strong></div>
      <div className="sniper-stat"><span className="sniper-stat-label">WAVE</span><strong data-testid="text-sniper-wave">{String(view.wave).padStart(2, '0')}</strong></div>
      <div className="sniper-stat lives-stat"><span className="sniper-stat-label"><Shield size={14} /> LIVES</span><strong data-testid="text-sniper-lives">{'◆ '.repeat(view.lives).trim() || '—'}</strong></div>
      <div className="sniper-ammo"><span className="sniper-stat-label">MAGAZINE</span><div className="ammo-slots" data-testid="text-sniper-ammo">{Array.from({ length: view.maxAmmo }, (_, index) => <i key={index} className={index < view.ammo ? 'loaded' : ''} />)}</div><small>{view.reloading ? 'RELOADING' : `${view.ammo} / ${view.maxAmmo}`}</small></div>
    </div>
    <div className="sniper-stage">
      <Canvas camera={{ position: [0, 2.25, 8.7], fov: 56 }} dpr={[1, 1.6]} onPointerMissed={() => shoot(null, 'body')}>
        <SniperTicker advance={advance} />
        <NightRange state={view} onShoot={shoot} />
      </Canvas>
      <div className="scope-vignette" aria-hidden="true" />
      <div className="scope-reticle" aria-hidden="true"><span /><i /><b /></div>
      <div className="sniper-caption"><span>FIELD 07</span><span>OUTSKIRTS · NIGHT</span><span>RANGE ACTIVE</span></div>
      {(view.status === 'ready' || view.status === 'over') && <div className="sniper-overlay">
        <div className="sniper-card" data-testid={`status-sniper-${view.status}`}>
          <div className="sniper-card-kicker"><Crosshair size={15} /> NIGHT SHIFT / SECTOR 07</div>
          <h2>{view.status === 'ready' ? <>Hold the line.<br /><em>Take your shot.</em></> : <>The range<br /><em>is quiet.</em></>}</h2>
          <p>{view.status === 'ready' ? 'Keep the targets in sight. Headshots score 250. Let three slip through and the run is over.' : `Run complete. ${view.kills} targets down across ${view.wave} ${view.wave === 1 ? 'wave' : 'waves'}.`}</p>
          <button className="button sniper-start" onClick={start} data-testid="button-sniper-start">{view.status === 'ready' ? 'Start the run' : 'Run it back'} {view.status === 'over' ? <RotateCcw size={16} /> : <Zap size={16} />}</button>
          <div className="sniper-hint">TAP HEAD OR BODY TO SHOOT <span>·</span> R TO RELOAD</div>
        </div>
      </div>}
      {view.status === 'playing' && <div className="sniper-live-note" aria-live="polite" data-testid="status-sniper-live">{view.reloading ? `Reloading · ${Math.ceil(view.reloadRemainingMs / 100) / 10}s` : view.ammo === 0 ? 'Empty magazine — reload' : 'Hold steady'}</div>}
    </div>
    <div className="sniper-controls">
      <div className="sniper-control-copy"><span className="eyebrow">Stay sharp</span><strong>Pick your shot. Don’t let them through.</strong><small>Tap a target to fire · Every miss uses a round</small></div>
      <button className={`button sniper-reload ${view.reloading ? 'is-reloading' : ''}`} onClick={reload} disabled={view.status !== 'playing' || view.reloading || view.ammo === view.maxAmmo} data-testid="button-sniper-reload">
        <RotateCcw size={16} className={view.reloading ? 'reload-icon' : ''} /> {view.reloading ? 'Reloading' : 'Reload'} <kbd>R</kbd>
      </button>
    </div>
    {view.reloading && <div className="reload-track" aria-label="Reload progress"><span style={{ transform: `scaleX(${reloadProgress})` }} /></div>}
  </div>;
}
