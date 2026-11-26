import type { BiomeId } from "./deep-signal-engine";
import type { WeaponArchetype } from "./deep-signal-store";
export type MusicMode =
  | 'off'
  | 'menu'
  | 'explore'
  | 'combat'
  | 'boss'
  | 'corrupted';

const BIOME_GROOVES: Record<
  string,
  {
    rootHz: number;
    melody: number[];
    harmony: number[];
    bass: number[];
    stepMs: number;
  }
> = {
  'outer-bunker': {
    rootHz: 73.42, // D2
    melody: Array.of(
      12,
      -1,
      15,
      19,
      17,
      -1,
      15,
      14,
      12,
      -1,
      10,
      12,
      14,
      -1,
      7,
      -1
    ),
    harmony: Array.of(
      7,
      -1,
      -1,
      -1,
      10,
      -1,
      -1,
      -1,
      8,
      -1,
      -1,
      -1,
      7,
      -1,
      -1,
      -1
    ),
    bass: Array.of(0, -1, 7, -1, 3, -1, 10, -1, 5, -1, 12, -1, 7, -1, 2, -1),
    stepMs: 285,
  },
  'coolant-conduits': {
    rootHz: 65.41, // C2
    melody: Array.of(
      12,
      15,
      19,
      24,
      22,
      -1,
      19,
      15,
      17,
      -1,
      15,
      14,
      12,
      -1,
      7,
      -1
    ),
    harmony: Array.of(
      3,
      -1,
      -1,
      -1,
      7,
      -1,
      -1,
      -1,
      5,
      -1,
      -1,
      -1,
      7,
      -1,
      -1,
      -1
    ),
    bass: Array.of(0, -1, 7, -1, 8, -1, 15, -1, 5, -1, 12, -1, 7, -1, 10, -1),
    stepMs: 275,
  },
  'relay-archives': {
    rootHz: 55.0, // A1
    melody: Array.of(
      12,
      14,
      15,
      19,
      17,
      15,
      14,
      12,
      15,
      19,
      22,
      19,
      17,
      -1,
      15,
      14
    ),
    harmony: Array.of(
      7,
      -1,
      -1,
      -1,
      8,
      -1,
      -1,
      -1,
      10,
      -1,
      -1,
      -1,
      11,
      -1,
      -1,
      -1
    ),
    bass: Array.of(0, -1, 12, -1, 3, -1, 15, -1, 5, -1, 17, -1, 7, -1, 11, -1),
    stepMs: 268,
  },
  'thermal-abyss': {
    rootHz: 82.41, // E2
    melody: Array.of(
      12,
      -1,
      13,
      17,
      19,
      -1,
      17,
      13,
      12,
      15,
      17,
      19,
      20,
      -1,
      19,
      17
    ),
    harmony: Array.of(
      5,
      -1,
      -1,
      -1,
      7,
      -1,
      -1,
      -1,
      8,
      -1,
      -1,
      -1,
      7,
      -1,
      -1,
      -1
    ),
    bass: Array.of(0, -1, 7, -1, 1, -1, 8, -1, 3, -1, 10, -1, 5, -1, 7, -1),
    stepMs: 258,
  },
  'signal-core': {
    rootHz: 87.31, // F2
    melody: Array.of(
      12,
      19,
      17,
      15,
      12,
      15,
      19,
      24,
      22,
      19,
      17,
      15,
      14,
      12,
      11,
      12
    ),
    harmony: Array.of(
      7,
      -1,
      -1,
      -1,
      8,
      -1,
      -1,
      -1,
      10,
      -1,
      -1,
      -1,
      11,
      -1,
      -1,
      -1
    ),
    bass: Array.of(0, -1, 7, -1, 8, -1, 15, -1, 3, -1, 10, -1, 7, -1, 11, -1),
    stepMs: 250,
  },
};

function semitoneToHz(rootHz: number, semis: number): number {
  return rootHz * Math.pow(2, semis / 12);
}

class DeepSignalAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private mode: MusicMode = 'off';
  private biome: BiomeId = 'outer-bunker';
  private step = 0;
  private timerId: number | null = null;
  private corruptedUntil = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 0.28;

      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.34;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1250;

      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(master);
      master.connect(ctx.destination);

      const len = Math.floor(ctx.sampleRate * 1.0);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;

      this.ctx = ctx;
      this.masterGain = master;
      this.delayNode = delay;
      this.noiseBuffer = buf;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : 0.28,
        this.ctx.currentTime,
        0.04
      );
    }
    return this.muted;
  }

  public updateMusicState(mode: MusicMode, biome: BiomeId) {
    if (Date.now() < this.corruptedUntil && mode !== 'off') {
      this.biome = biome;
      return;
    }
    const changed = this.mode !== mode || this.biome !== biome;
    this.mode = mode;
    this.biome = biome;

    if (mode === 'off') {
      this.stopLoop();
      return;
    }
    if (changed || this.timerId === null) {
      this.startLoop();
    }
  }

  private stopLoop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startLoop() {
    this.stopLoop();
    const groove = BIOME_GROOVES[this.biome] ?? BIOME_GROOVES["outer-bunker"]!;
    const interval =
      this.mode === 'boss'
        ? Math.round(groove.stepMs * 0.88)
        : this.mode === 'combat'
        ? Math.round(groove.stepMs * 0.94)
        : Math.round(groove.stepMs * 1.12);

    this.timerId = window.setInterval(() => {
      if (this.muted || this.mode === 'off') return;
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain || !this.delayNode) return;
      this.playGrooveStep(ctx, this.masterGain, this.delayNode);
    }, interval);
  }

  private playGrooveStep(
    ctx: AudioContext,
    master: GainNode,
    delay: DelayNode
  ) {
    const now = ctx.currentTime;
    const groove = BIOME_GROOVES[this.biome] ?? BIOME_GROOVES["outer-bunker"]!;
    const idx = this.step % 16;
    this.step += 1;

    const isCombat = this.mode === 'combat' || this.mode === 'boss';
    const isBoss = this.mode === 'boss';

    if (idx % 4 === 0 || (isBoss && idx === 14)) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(isBoss ? 120 : 105, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.16);

      kickGain.gain.setValueAtTime(isCombat ? 0.24 : 0.13, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      kickOsc.connect(kickGain);
      kickGain.connect(master);
      kickOsc.start(now);
      kickOsc.stop(now + 0.19);
    }

    if ((idx === 4 || idx === 12) && this.noiseBuffer && this.mode !== 'menu') {
      const snare = ctx.createBufferSource();
      snare.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(isCombat ? 0.11 : 0.055, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      snare.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(master);
      snare.start(now);
      snare.stop(now + 0.12);
    }

    if (this.noiseBuffer && idx % 2 === 1) {
      const hat = ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7200;
      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(isCombat ? 0.036 : 0.02, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      hat.connect(hp);
      hp.connect(hatGain);
      hatGain.connect(master);
      hat.start(now);
      hat.stop(now + 0.055);
    }

    const bassSemi = groove.bass.at(idx) ?? -1;
    if (bassSemi >= 0) {
      const bassOsc = ctx.createOscillator();
      const bassFilter = ctx.createBiquadFilter();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(
        semitoneToHz(groove.rootHz, bassSemi),
        now
      );

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(isBoss ? 420 : 310, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(isCombat ? 0.19 : 0.14, now + 0.02);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);
      bassOsc.start(now);
      bassOsc.stop(now + 0.38);
    }

    const harmSemi = groove.harmony.at(idx) ?? -1;
    if (harmSemi >= 0) {
      const padOsc = ctx.createOscillator();
      const padFilter = ctx.createBiquadFilter();
      const padGain = ctx.createGain();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(
        semitoneToHz(groove.rootHz * 2, harmSemi),
        now
      );

      padFilter.type = 'lowpass';
      padFilter.frequency.value = 850;

      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(0.055, now + 0.14);
      padGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(master);
      padGain.connect(delay);
      padOsc.start(now);
      padOsc.stop(now + 0.98);
    }

    const leadSemi = groove.melody.at(idx) ?? -1;
    if (leadSemi >= 0) {
      const leadOsc = ctx.createOscillator();
      const overtoneOsc = ctx.createOscillator();
      const leadFilter = ctx.createBiquadFilter();
      const leadGain = ctx.createGain();

      const freq = semitoneToHz(groove.rootHz * 2, leadSemi);
      leadOsc.type = isBoss ? 'sawtooth' : 'triangle';
      leadOsc.frequency.setValueAtTime(freq, now);

      overtoneOsc.type = 'sine';
      overtoneOsc.frequency.setValueAtTime(freq * 2, now);

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(isCombat ? 1750 : 1350, now);

      leadGain.gain.setValueAtTime(0.001, now);
      leadGain.gain.linearRampToValueAtTime(
        isCombat ? 0.085 : 0.068,
        now + 0.018
      );
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.value = 0.22;

      leadOsc.connect(leadFilter);
      overtoneOsc.connect(overtoneGain);
      overtoneGain.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(master);
      leadGain.connect(delay);

      leadOsc.start(now);
      overtoneOsc.start(now);
      leadOsc.stop(now + 0.36);
      overtoneOsc.stop(now + 0.36);
    }
  }

  public triggerCorruptedBossCheckpoint() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.delayNode) return;

    this.corruptedUntil = Date.now() + 3600;
    const now = ctx.currentTime;

    const chord = Array.of(293.66, 349.23, 440.0, 587.33);
    chord.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz, now + i * 0.14);
      gain.gain.setValueAtTime(0.14, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.85);
      osc.connect(gain);
      gain.connect(this.delayNode!);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.9);
    });
  }

  public playWeaponSwing(weapon?: WeaponArchetype) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (weapon === 'Plasma Cleaver') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
    } else if (weapon === 'Executioner') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.2);
    } else if (weapon === 'Rapier') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(290, now + 0.09);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playCombatHit(kind: 'hit' | 'parry' | 'hurt') {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (kind === 'parry') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1380, now + 0.12);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    } else if (kind === 'hurt') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.18);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(64, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playEnemyKill(isBoss = false) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(isBoss ? 160 : 135, now);
    boom.frequency.exponentialRampToValueAtTime(
      32,
      now + (isBoss ? 0.35 : 0.18)
    );
    boomGain.gain.setValueAtTime(isBoss ? 0.26 : 0.18, now);
    boomGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isBoss ? 0.37 : 0.2)
    );
    boom.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + (isBoss ? 0.38 : 0.21));

    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(587.33, now + 0.04);
    chime.frequency.setValueAtTime(880, now + 0.1);
    chimeGain.gain.setValueAtTime(0.14, now + 0.04);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(now + 0.04);
    chime.stop(now + 0.28);
  }

  public playPickup(kind: 'gold' | 'diamond' | 'gear') {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes =
      kind === 'diamond'
        ? Array.of(987.77, 1318.51, 1567.98)
        : kind === 'gear'
        ? Array.of(523.25, 659.25, 783.99, 1046.5)
        : Array.of(880, 1174.66);

    notes.forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'diamond' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(hz, now + idx * 0.045);
      gain.gain.setValueAtTime(0.12, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.18);
    });
  }

  public playUiChime(
    kind: 'chest' | 'ascend' | 'upgrade' | 'extract' | 'shop' | 'sell'
  ) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes =
      kind === 'ascend'
        ? Array.of(440, 554.37, 659.25, 880, 1108.73)
        : kind === 'upgrade'
        ? Array.of(523.25, 659.25, 880)
        : kind === 'sell'
        ? Array.of(659.25, 880)
        : kind === 'chest'
        ? Array.of(523.25, 659.25, 783.99, 1046.5)
        : kind === 'extract'
        ? Array.of(440, 554.37, 659.25, 880)
        : Array.of(587.33, 739.99, 880);

    notes.forEach((hz, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.24);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.26);
    });
  }
}

export const deepSignalAudio = new DeepSignalAudioEngine();
