import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode, type TouchEvent } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CircleHelp, Gamepad2, RotateCcw, Trash2, UserRound, Users } from 'lucide-react';
import { addFriend, getArcadeState, recordGameResult, removeFriend, saveArcadeState, updateProfile, type ArcadeProfile, type ArcadeState, type GameId } from './lib/arcade-store';
import { ZombieSniperGame } from './components/ZombieSniperGame';
import { BuriedComplexGame } from './components/BuriedComplexGame';

const titles: Record<GameId, string> = { snake: 'Snake', memory: 'Memory Match', tictactoe: 'Tic-Tac-Toe', '2048': '2048', sniper: 'Zombie Sniper', 'deep-signal': 'The Signal Below' };
const descriptions: Record<GameId, string> = { snake: 'A little loop around the garden.', memory: 'Flip, remember, find the pair.', tictactoe: 'A classic, best played side by side.', '2048': 'Slide the tiles. Make a big number.', sniper: 'Hold your breath. Defend the night.', 'deep-signal': 'A missing surveyor. A sealed entrance. Three rooms below.' };
const avatars = ['SUN', 'ARC', 'DOT', 'ORB', 'FOX', 'BEE'];
const themes = ['cosmic', 'citrus', 'sunset', 'ocean'];
const frames = ['neon', 'classic', 'soft'];

function initials(name: string) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'P';
}

function AppShell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const state = getArcadeState();
  return <div className="arcade-shell">
    <header className="topbar">
      <Link href="/" className="brand" data-testid="link-home"><span className="brand-mark"><Gamepad2 size={20} /></span><span>JB PLAYNET BETA</span></Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`} data-testid="link-arcade">Arcade</Link>
        <Link href="/friends" className={`nav-link ${path === '/friends' ? 'active' : ''}`} data-testid="link-friends">Friends</Link>
      </nav>
      <Link href="/profile" className="profile-link" data-testid="link-profile"><span className="avatar">{initials(state.profile.displayName)}</span><span>{state.profile.displayName}</span></Link>
    </header>
    {children}
    <footer className="footer"><span>JB PLAYNET BETA · A little play goes a long way.</span><span>Free to play · Saved only on this device</span></footer>
  </div>;
}

function Lobby() {
  const state = getArcadeState();
  return <main className="content fade-in">
    <section className="hero signal-home-hero">
      <div className="hero-copy">
        <div className="eyebrow">JB PLAYNET BETA · FIRST FIELD TEST</div>
        <h1>Something is<br />still transmitting.</h1>
        <p>A surveyor went missing beneath the ridge. Enter the buried complex, follow their distress signal, and decide what is worth carrying back.</p>
        <Link href="/play/deep-signal" className="button" data-testid="button-start-playing">Enter the complex <ArrowRight size={17} /></Link>
      </div>
      <div className="signal-hero-art" aria-hidden="true"><span className="signal-ring ring-one" /><span className="signal-ring ring-two" /><span className="signal-core" /><i className="signal-axis" /></div>
    </section>
    <div className="section-heading"><div><div className="eyebrow">One signal. Three rooms.</div><h2>THE SIGNAL BELOW</h2></div><p>A compact keyboard-and-mouse expedition. Free, solo, saved on this device.</p></div>
    <section className="signal-feature" data-testid="card-game-deep-signal">
      <div className="signal-feature-art" aria-hidden="true">
        <div className="feature-grid" /><div className="feature-door"><span /><span /><span /></div>
        <div className="feature-explorer"><i /></div>
        <div className="feature-stamp">FIELD<br />RECORD<br /><b>01</b></div>
        <div className="feature-coord">184 M / BELOW GRADE</div>
      </div>
      <div className="signal-feature-copy">
        <div className="eyebrow">First playable · single player</div>
        <h3>The entrance sealed.<br /><em>The signal did not.</em></h3>
        <p>Fight through three small spaces, read enemy wind-ups, and gather equipment from the floor. Bank it at a relay door—or carry your haul deeper and risk losing it.</p>
        <div className="feature-facts"><span>03 <small>ROOMS</small></span><span>LOCAL <small>GEAR SAVE</small></span><span>NO <small>ACCOUNT</small></span></div>
        <Link href="/play/deep-signal" className="button" data-testid="link-open-deep-signal">Play The Signal Below <ArrowRight size={16} /></Link>
      </div>
    </section>
    <div className="section-heading"><div><div className="eyebrow">Your corner of the arcade</div><h2>Small wins, kept close</h2></div><p>Personal bests stay in this browser.</p></div>
    <section className="mini-score">
      <div className="score-chip"><strong>{state.totalGamesPlayed}</strong> games played here</div>
      <div className="score-chip" data-testid="text-best-deep-signal"><strong>{state.highScores['deep-signal'] ?? '—'}</strong> best run</div>
      <Link href="/profile" className="button outline small" data-testid="button-customize-profile"><UserRound size={15} /> Make it yours</Link>
    </section>
    <section className="field-note" data-testid="status-game-promise">
      <span className="eyebrow">Field note</span><p>This is an early single-player test, not an online dungeon. Friends can each take a run and compare their personal best from the same browser.</p>
      <Link href="/friends" className="button light small" data-testid="link-friends-lobby"><Users size={15} /> Your friends list</Link>
    </section>
  </main>;
}

function FriendsPage() {
  const [state, setState] = useState<ArcadeState>(() => getArcadeState());
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) { setMessage('Add a name to save a friend.'); return; }
    const before = state.friends.length;
    const next = addFriend(name);
    setState(next);
    setMessage(next.friends.length === before ? 'That name is already on your list.' : `${name.trim()} added to your local list.`);
    if (next.friends.length !== before) setName('');
  };
  const remove = (friend: string) => { setState(removeFriend(friend)); setMessage(`${friend} removed.`); };
  return <main className="content fade-in">
    <div className="eyebrow">Your people, your device</div><h1 className="page-title">Friends list</h1>
    <p className="page-intro">Keep names close, then compare your runs through the buried complex. This list is saved locally and never sends invites or connection requests.</p>
    <div className="game-layout">
      <section className="panel">
        <div className="eyebrow">Add someone</div><h2 style={{ margin: '7px 0 4px', letterSpacing: '-.05em' }}>Who’s taking the signal?</h2>
        <p className="notice">Just a name for your own list — no account needed.</p>
        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <label className="field-label" htmlFor="friend-name">Friend’s display name</label>
          <div className="form-row"><input id="friend-name" className="text-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="e.g. Sam" data-testid="input-friend-name" /><button className="button" type="submit" data-testid="button-add-friend">Add friend <ArrowRight size={15} /></button></div>
        </form>
        {message && <p className="notice" role="status" data-testid="status-friend-message">{message}</p>}
      </section>
      <aside className="panel" style={{ background: '#e7e3d2' }}>
        <div className="eyebrow">One explorer at a time</div><h3 style={{ fontSize: 22, letterSpacing: '-.05em', margin: '8px 0' }}>Compare who comes back.</h3>
        <p className="notice">Each run is solo. Friends can try the same three-room descent and compare personal bests saved in this browser.</p>
        <Link href="/play/deep-signal" className="button light small" style={{ marginTop: 12 }} data-testid="button-open-deep-signal">Enter the complex <ArrowRight size={15} /></Link>
      </aside>
    </div>
    <div className="section-heading"><div><div className="eyebrow">Saved on this device</div><h2>Your friends</h2></div><p>{state.friends.length} {state.friends.length === 1 ? 'name' : 'names'}</p></div>
    {state.friends.length ? <div className="friend-list">{state.friends.map((friend) => <div className="friend-row" key={friend} data-testid={`row-friend-${friend}`}><div className="friend-person"><span className="friend-avatar">{initials(friend)}</span>{friend}</div><button className="button outline small" onClick={() => remove(friend)} aria-label={`Remove ${friend}`} data-testid={`button-remove-${friend}`}><Trash2 size={14} /> Remove</button></div>)}</div> : <div className="empty-state"><Users size={26} /><strong>Your list starts with a name.</strong><p>Add a friend above, then compare local runs through The Signal Below.</p></div>}
  </main>;
}

function ProfilePage() {
  const [state, setState] = useState<ArcadeState>(() => getArcadeState());
  const [saved, setSaved] = useState(false);
  const [draftName, setDraftName] = useState(state.profile.displayName);
  const update = (patch: Partial<ArcadeProfile>) => { const next = updateProfile(patch); setState(saveArcadeState(next)); setSaved(false); };
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    const clean = draftName.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!clean) { setDraftName(state.profile.displayName); return; }
    const next = updateProfile({ displayName: clean }); setState(next); setDraftName(clean); setSaved(true);
  };
  const profile = state.profile;
  const safeAvatar = avatars.includes(profile.avatar) ? profile.avatar : 'ARC';
  return <main className="content fade-in">
    <div className="eyebrow">Your player card</div><h1 className="page-title">Make it yours.</h1>
    <p className="page-intro">Choose a name and look that feel like you. Your profile stays in this browser, on this device.</p>
    <div className="game-layout">
      <section className="panel">
        <div className="eyebrow">The basics</div>
        <form onSubmit={saveName}>
          <label className="field-label" htmlFor="display-name">Display name</label>
          <div className="form-row"><input id="display-name" className="text-field" value={draftName} onChange={(e) => { setDraftName(e.target.value); setSaved(false); }} maxLength={24} data-testid="input-display-name" /><button className="button" type="submit" data-testid="button-save-name">Save name</button></div>
        </form>
        {saved && <p className="notice" role="status" data-testid="status-profile-saved">Your name is saved on this device.</p>}
        <div className="field-label">Choose an avatar mark</div>
        <div className="choice-row">{avatars.map((avatar) => <button key={avatar} className={`choice ${profile.avatar === avatar ? 'selected' : ''}`} onClick={() => update({ avatar })} data-testid={`button-avatar-${avatar.toLowerCase()}`}>{avatar}</button>)}</div>
        <div className="field-label">Pick a colorway</div>
        <div className="choice-row">{themes.map((theme) => <button key={theme} className={`choice ${profile.theme === theme ? 'selected' : ''}`} onClick={() => update({ theme })} data-testid={`button-theme-${theme}`}>{theme[0].toUpperCase() + theme.slice(1)}</button>)}</div>
        <div className="field-label">Choose a frame</div>
        <div className="choice-row">{frames.map((frame) => <button key={frame} className={`choice ${profile.frame === frame ? 'selected' : ''}`} onClick={() => update({ frame })} data-testid={`button-frame-${frame}`}>{frame[0].toUpperCase() + frame.slice(1)}</button>)}</div>
      </section>
      <aside className="panel" style={{ background: '#e7e3d2', alignSelf: 'start' }}>
        <div className="eyebrow">Preview</div>
        <div className={`theme-preview theme-${themes.includes(profile.theme) ? profile.theme : 'cosmic'}`}><span className={`avatar frame-${frames.includes(profile.frame) ? profile.frame : 'classic'}`}>{safeAvatar}</span><div><strong style={{ fontSize: 20, letterSpacing: '-.04em' }}>{profile.displayName}</strong><div className="notice">Player · local profile</div></div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 13 }}><CircleHelp size={16} /><span className="notice">Free choices. No unlocks, purchases, or sign-in.</span></div>
        <div style={{ borderTop: '1px solid #d0cbbb', marginTop: 20, paddingTop: 17 }}><div className="eyebrow">Your play so far</div><div style={{ fontSize: 26, fontWeight: 700, marginTop: 5 }}>{state.totalGamesPlayed} <span style={{ fontSize: 14, fontWeight: 500 }}>games completed</span></div></div>
      </aside>
    </div>
  </main>;
}

function randCell(exclude: number[] = []) {
  const open = Array.from({ length: 324 }, (_, i) => i).filter((i) => !exclude.includes(i));
  return open[Math.floor(Math.random() * open.length)] ?? 0;
}
type Dir = 'up' | 'down' | 'left' | 'right';
const vectors: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function SnakeGame({ finish, onRestart }: { finish: (score: number) => void; onRestart: () => void }) {
  const [snake, setSnake] = useState([151, 150, 149]);
  const [food, setFood] = useState(170);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const dir = useRef<Dir>('right'); const nextDir = useRef<Dir>('right');
  const start = () => { setSnake([151, 150, 149]); setFood(170); setScore(0); setOver(false); setRunning(true); dir.current = 'right'; nextDir.current = 'right'; };
  const turn = useCallback((d: Dir) => {
    const reverse: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (reverse[dir.current] !== d) nextDir.current = d;
  }, []);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
      const found = map[event.key]; if (found) { event.preventDefault(); turn(found); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [turn]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      dir.current = nextDir.current;
      const [dx, dy] = vectors[dir.current];
      const head = snake[0];
      const x = head % 18 + dx;
      const y = Math.floor(head / 18) + dy;
      const nextHead = y * 18 + x;
      const eating = nextHead === food;
      const body = eating ? snake : snake.slice(0, -1);
      if (x < 0 || x > 17 || y < 0 || y > 17 || body.includes(nextHead)) {
        setRunning(false);
        setOver(true);
        finish(score);
        return;
      }
      const nextSnake = [nextHead, ...snake.slice(0, eating ? snake.length : -1)];
      setSnake(nextSnake);
      if (eating) {
        setScore((n) => n + 1);
        setFood(randCell(nextSnake));
      }
    }, 145);
    return () => window.clearInterval(timer);
  }, [running, snake, food, score, finish]);
  const cells = Array.from({ length: 324 }, (_, i) => i);
  return <><div className="snake-board" aria-label="Snake game board" data-testid="game-board-snake">{cells.map((cell) => {
    const head = snake[0] === cell; const body = snake.includes(cell);
    return <div key={cell} className={`snake-cell ${body ? 'snake' : ''} ${head ? 'head' : ''} ${food === cell ? 'food' : ''}`} />;
  })}</div><div className="mobile-controls">
    <span /><button onClick={() => turn('up')} aria-label="Move up" data-testid="button-snake-up"><ArrowUp size={20} /></button><span />
    <button onClick={() => turn('left')} aria-label="Move left" data-testid="button-snake-left"><ArrowLeft size={20} /></button><button onClick={() => turn('down')} aria-label="Move down" data-testid="button-snake-down"><ArrowDown size={20} /></button><button onClick={() => turn('right')} aria-label="Move right" data-testid="button-snake-right"><ArrowRight size={20} /></button>
  </div><div className="game-actions"><button className="button" onClick={() => running ? setRunning(false) : over ? onRestart() : start()} data-testid="button-snake-start">{running ? 'Pause' : over ? 'Play again' : 'Start playing'} <ArrowRight size={15} /></button>{running && <button className="button outline small" onClick={() => setRunning(false)} data-testid="button-snake-pause">Pause</button>}</div>
  <p className="notice" style={{ textAlign: 'center', marginTop: 12 }}>{over ? 'Round over. Your score has been saved.' : running ? 'Use arrow keys or WASD. On touch, use the direction pad.' : 'Collect the coral dot. Don’t run into the edges or yourself.'}</p></>;
}

const matchMarks = ['●', '▲', '■', '◆', '✚', '✦', '⬟', '✿'];
function MemoryGame({ finish, onRestart }: { finish: (score: number) => void; onRestart: () => void }) {
  const [deck, setDeck] = useState(() => [...matchMarks, ...matchMarks].sort(() => Math.random() - .5));
  const [open, setOpen] = useState<number[]>([]); const [matched, setMatched] = useState<number[]>([]); const [moves, setMoves] = useState(0);
  const lock = useRef(false); const done = useRef(false);
  const flip = (index: number) => {
    if (lock.current || open.includes(index) || matched.includes(index)) return;
    const next = [...open, index]; setOpen(next);
    if (next.length === 2) {
      setMoves((n) => n + 1); lock.current = true;
      if (deck[next[0]] === deck[next[1]]) {
        const pairs = [...matched, ...next]; setMatched(pairs); setOpen([]); lock.current = false;
        if (pairs.length === deck.length && !done.current) { done.current = true; finish(Math.max(1, 1000 - (moves + 1) * 12)); }
      } else window.setTimeout(() => { setOpen([]); lock.current = false; }, 720);
    }
  };
  return <><div className="memory-grid" data-testid="game-board-memory">{deck.map((mark, index) => {
    const shown = open.includes(index) || matched.includes(index);
    return <button key={index} className={`memory-card ${shown ? 'open' : ''} ${matched.includes(index) ? 'matched' : ''}`} onClick={() => flip(index)} aria-label={shown ? `Card ${mark}` : 'Turn over card'} data-testid={`button-memory-card-${index}`}>{shown ? mark : '·'}</button>;
  })}</div><div className="game-actions"><button className="button outline small" onClick={onRestart} data-testid="button-memory-restart"><RotateCcw size={15} /> New round</button></div><p className="notice" style={{ textAlign: 'center' }}>{matched.length === 16 ? `All pairs found in ${moves} moves. Lovely work.` : `${matched.length / 2} of 8 pairs found · ${moves} ${moves === 1 ? 'move' : 'moves'}`}</p></>;
}

function TicTacToeGame({ state, finish, onRestart }: { state: ArcadeState; finish: (score: number) => void; onRestart: () => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null)); const [turn, setTurn] = useState('X'); const [winner, setWinner] = useState<string | null>(null);
  const done = useRef(false);
  const friend = state.friends[0] || 'Friend';
  const play = (index: number) => {
    if (board[index] || winner) return;
    const next = [...board]; next[index] = turn; setBoard(next);
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const line = wins.find(([a,b,c]) => next[a] && next[a] === next[b] && next[b] === next[c]);
    if (line) {
      setWinner(turn);
      if (!done.current) { done.current = true; finish(turn === 'X' ? 1 : 0); }
    } else if (next.every(Boolean)) { setWinner('draw'); if (!done.current) { done.current = true; finish(0); } }
    else setTurn(turn === 'X' ? 'O' : 'X');
  };
  const status = winner === 'draw' ? 'A draw. Nicely played.' : winner ? `${winner === 'X' ? state.profile.displayName : friend} takes the round.` : `${turn === 'X' ? state.profile.displayName : friend}’s turn`;
  return <><div className="ttt-status" data-testid="status-tictactoe">{status}</div><div className="ttt-board" data-testid="game-board-tictactoe">{board.map((cell, index) => <button key={index} className="ttt-cell" onClick={() => play(index)} aria-label={`Square ${index + 1}${cell ? `, ${cell}` : ''}`} data-testid={`button-ttt-square-${index}`}>{cell}</button>)}</div><div className="game-actions"><button className="button" onClick={onRestart} data-testid="button-ttt-new-round"><RotateCcw size={15} /> {winner ? 'Play another round' : 'Start a new round'}</button></div><p className="notice" style={{ textAlign: 'center' }}>Pass the device after each turn. {state.friends.length ? `${friend} is on your friends list.` : 'Add a friend on the Friends page to personalize the other side.'}</p></>;
}

type Grid = number[][];
function spawn(grid: Grid): Grid {
  const empty: [number, number][] = [];
  grid.forEach((row, y) => row.forEach((v, x) => { if (!v) empty.push([y,x]); }));
  if (!empty.length) return grid;
  const [y,x] = empty[Math.floor(Math.random() * empty.length)]; const next = grid.map((row) => [...row]); next[y][x] = Math.random() < .9 ? 2 : 4; return next;
}
function freshGrid(): Grid { return spawn(spawn(Array.from({ length: 4 }, () => [0,0,0,0]))); }
function compress(line: number[]) {
  const nums = line.filter(Boolean); let gain = 0;
  for (let i = 0; i < nums.length - 1; i++) if (nums[i] === nums[i + 1]) { nums[i] *= 2; gain += nums[i]; nums.splice(i + 1, 1); }
  while (nums.length < 4) nums.push(0);
  return { line: nums, gain };
}
function Game2048({ finish, onRestart }: { finish: (score: number) => void; onRestart: () => void }) {
  const [grid, setGrid] = useState<Grid>(freshGrid); const [score, setScore] = useState(0); const [over, setOver] = useState(false); const done = useRef(false); const touch = useRef<[number,number] | null>(null);
  const move = useCallback((direction: Dir) => {
    if (over) return;
    let gain = 0;
    const rotated = grid.map((row) => [...row]);
    const clockwise = (g: Grid) => g[0].map((_, x) => g.map((r) => r[x]).reverse());
    const turns = direction === 'left' ? 0 : direction === 'down' ? 1 : direction === 'right' ? 2 : 3;
    let work = rotated; for (let i = 0; i < turns; i++) work = clockwise(work);
    work = work.map((row) => { const c = compress(row); gain += c.gain; return c.line; });
    for (let i = 0; i < (4 - turns) % 4; i++) work = clockwise(work);
    if (work.every((row, y) => row.every((v, x) => v === grid[y][x]))) return;
    const next = spawn(work); const newScore = score + gain; setGrid(next); setScore(newScore);
    const canMove = next.some((row, y) => row.some((v, x) => !v || (x < 3 && v === row[x + 1]) || (y < 3 && v === next[y + 1][x])));
    if (!canMove) { setOver(true); if (!done.current) { done.current = true; finish(newScore); } }
  }, [grid, over, score, finish]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { const map: Record<string, Dir> = { ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right', ArrowUp:'up', w:'up', ArrowDown:'down', s:'down' }; const d = map[e.key]; if (d) { e.preventDefault(); move(d); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [move]);
  const touchStart = (e: TouchEvent) => { touch.current = [e.touches[0].clientX, e.touches[0].clientY]; };
  const touchEnd = (e: TouchEvent) => {
    if (!touch.current) return; const dx = e.changedTouches[0].clientX - touch.current[0]; const dy = e.changedTouches[0].clientY - touch.current[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    touch.current = null;
  };
  return <><div style={{ textAlign: 'center', marginBottom: 10 }}><span className="score-chip">Score <strong>{score}</strong></span></div><div className="board-2048" onTouchStart={touchStart} onTouchEnd={touchEnd} data-testid="game-board-2048">{grid.flat().map((value, i) => <div key={i} className="tile" data-value={value || 'empty'}>{value || ''}</div>)}</div><div className="game-actions"><button className="button outline small" onClick={onRestart} data-testid="button-2048-restart"><RotateCcw size={15} /> New game</button></div><p className="notice" style={{ textAlign: 'center' }}>{over ? 'No more moves. Your score has been saved.' : 'Use arrow keys, WASD, or swipe to move the tiles.'}</p></>;
}

function GamePage({ id }: { id: GameId }) {
  const [state, setState] = useState<ArcadeState>(() => getArcadeState());
  const [session, setSession] = useState(0);
  const finished = useRef(false);
  const finish = useCallback((score: number) => {
    if (finished.current) return;
    finished.current = true;
    setState(recordGameResult(id, score));
  }, [id]);
  const finishSniper = useCallback((score: number) => {
    finished.current = false;
    finish(score);
  }, [finish]);
  useEffect(() => { finished.current = false; }, [session]);
  const restartGame = () => { finished.current = false; setSession((n) => n + 1); };
  const best = state.highScores[id];
  const game = id === 'sniper' ? <ZombieSniperGame key={session} onFinish={finishSniper} /> : id === 'snake' ? <SnakeGame key={session} finish={finish} onRestart={restartGame} /> : id === 'memory' ? <MemoryGame key={session} finish={finish} onRestart={restartGame} /> : id === 'tictactoe' ? <TicTacToeGame key={session} state={state} finish={finish} onRestart={restartGame} /> : <Game2048 key={session} finish={finish} onRestart={restartGame} />;
  return <main className="content fade-in">
    <Link href="/" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 0 20px -12px' }} data-testid="link-back-arcade"><ArrowLeft size={15} /> Arcade</Link>
    <div className="game-layout">
      <section className="panel game-main">
        <div className="game-toolbar"><div><div className="eyebrow">Now playing</div><h1 className="page-title" style={{ fontSize: 'clamp(32px,5vw,48px)', margin: '6px 0 0' }}>{titles[id]}</h1></div><span className="score-number">FREE TO PLAY</span></div>
        {game}
      </section>
      <aside className="game-side">
        <section className="panel"><div className="eyebrow">Your best</div><div style={{ fontSize: 35, fontWeight: 700, letterSpacing: '-.07em', margin: '4px 0' }} data-testid={`text-best-${id}`}>{best ?? '—'}</div><div className="notice">{best === undefined ? 'Your first score will live here.' : 'Personal best, saved in this browser.'}</div></section>
         <section className="panel" style={{ background: '#e7e3d2' }}><div className="eyebrow">The quick brief</div><h3 style={{ margin: '7px 0', fontSize: 20, letterSpacing: '-.05em' }}>{descriptions[id]}</h3><p className="notice">{id === 'sniper' ? 'Aim by tapping a target. Headshots are worth 250, body shots 100; missed shots use a round. Press R or use Reload to refill.' : id === 'tictactoe' ? 'Two players, one screen. Take turns and pass the device.' : id === 'snake' ? 'Guide your snake with arrow keys or WASD. Touch controls are ready on small screens.' : id === 'memory' ? 'Turn over two cards at a time and match all eight pairs.' : 'Slide equal tiles together. Keep playing until there are no moves left.'}</p></section>
        <button className="button outline small" onClick={restartGame} data-testid={`button-reset-${id}`}><RotateCcw size={15} /> Start fresh</button>
        <Link href="/friends" className="button light small" data-testid="link-game-friends"><Users size={15} /> Friends list</Link>
      </aside>
    </div>
  </main>;
}

function DeepSignalPage() {
  const [state, setState] = useState<ArcadeState>(() => getArcadeState());
  const finish = useCallback((score: number) => {
    setState(recordGameResult('deep-signal', score));
  }, []);
  const best = state.highScores['deep-signal'];
  return <main className="content fade-in deep-signal-page">
    <Link href="/" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 0 16px -12px' }} data-testid="link-back-arcade"><ArrowLeft size={15} /> JB Playnet</Link>
    <div className="deep-game-heading">
      <div><div className="eyebrow">FIRST FIELD TEST / SINGLE PLAYER</div><h1 className="page-title">THE SIGNAL BELOW</h1><p className="page-intro">A missing surveyor’s distress beacon. A sealed entrance. The story is somewhere below.</p></div>
      <div className="deep-best"><small>YOUR BEST RUN</small><strong data-testid="text-best-deep-signal">{best ?? '—'}</strong><span>{best === undefined ? 'Your first descent is waiting.' : 'Saved in this browser.'}</span></div>
    </div>
    <BuriedComplexGame onFinish={finish} />
    <div className="deep-game-disclaimer" data-testid="status-local-play"><span>NO ACCOUNTS · NO PURCHASES · NO ONLINE PLAY</span><span>Gear and records stay on this device.</span></div>
  </main>;
}

function NotFoundPage() {
  return <main className="content"><section className="panel" style={{ textAlign: 'center', padding: 50 }}><div className="eyebrow">Wrong turn</div><h1 className="page-title">No signal on this route.</h1><Link className="button" href="/">Back to JB Playnet <ArrowRight size={16} /></Link></section></main>;
}

function Router() {
  return <Switch>
    <Route path="/"><AppShell><Lobby /></AppShell></Route>
    <Route path="/friends"><AppShell><FriendsPage /></AppShell></Route>
    <Route path="/profile"><AppShell><ProfilePage /></AppShell></Route>
    <Route path="/play/deep-signal"><AppShell><DeepSignalPage /></AppShell></Route>
    <Route><AppShell><NotFoundPage /></AppShell></Route>
  </Switch>;
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return <WouterRouter base={base}><Router /></WouterRouter>;
}
