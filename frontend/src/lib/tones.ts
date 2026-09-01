// Alert tones — specification §2.4.
//
// Synthesised with the Web Audio API rather than shipped as audio files. Five
// distinct tones as five short note sequences is a few hundred bytes of code
// against a few hundred kilobytes of MP3, they stay crisp at any volume, and
// there is no third-party asset to license or to fail to load.

export type ToneId = 'bell' | 'chime' | 'ping' | 'marimba' | 'alert';

export interface ToneDef {
  id: ToneId;
  /** Frequency in Hz, start offset and length in seconds. */
  notes: { hz: number; at: number; for: number }[];
  wave: OscillatorType;
}

export const TONES: ToneDef[] = [
  {
    // A struck bell: one note, long decay, a fifth above ringing under it.
    id: 'bell', wave: 'sine',
    notes: [
      { hz: 880, at: 0, for: 0.9 },
      { hz: 1320, at: 0.01, for: 0.7 },
    ],
  },
  {
    // Two rising notes, unhurried.
    id: 'chime', wave: 'sine',
    notes: [
      { hz: 659, at: 0, for: 0.35 },
      { hz: 988, at: 0.16, for: 0.5 },
    ],
  },
  {
    // One short blip. The least intrusive of the five.
    id: 'ping', wave: 'triangle',
    notes: [{ hz: 1200, at: 0, for: 0.16 }],
  },
  {
    // Wooden and warm: three quick notes up a triad.
    id: 'marimba', wave: 'triangle',
    notes: [
      { hz: 523, at: 0, for: 0.22 },
      { hz: 659, at: 0.09, for: 0.22 },
      { hz: 784, at: 0.18, for: 0.34 },
    ],
  },
  {
    // Insistent: two hard repeats, deliberately harder to ignore. This is the
    // priority tone for a late or escalated order.
    id: 'alert', wave: 'square',
    notes: [
      { hz: 740, at: 0, for: 0.14 },
      { hz: 740, at: 0.22, for: 0.14 },
      { hz: 880, at: 0.44, for: 0.26 },
    ],
  },
];

export const TONE_LABEL: Record<ToneId, string> = {
  bell: 'Classic bell',
  chime: 'Chime',
  ping: 'Ping',
  marimba: 'Marimba',
  alert: 'Alert',
};

/** The tone the spec reserves for late and escalated orders. */
export const PRIORITY_TONE: ToneId = 'alert';

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!context) {
      const Ctor = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    return context;
  } catch {
    return null;
  }
}

/**
 * True once the browser will actually let sound through.
 *
 * Autoplay is blocked until the page has been interacted with, which is why
 * §2.4 asks for a one-time prompt rather than assuming the first order will be
 * audible.
 */
export function soundIsUnlocked(): boolean {
  return audio()?.state === 'running';
}

/** Called from a real click, which is the only thing that lifts the block. */
export async function unlockSound(): Promise<boolean> {
  const ctx = audio();
  if (!ctx) return false;
  try {
    await ctx.resume();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/**
 * Plays a tone at a volume between 0 and 1.
 *
 * Returns false when nothing was heard — muted, blocked, or no audio support —
 * so the caller can fall back to something visible rather than assume the
 * operator was told.
 */
export function playTone(id: ToneId, volume: number): boolean {
  if (volume <= 0) return false;
  const ctx = audio();
  if (!ctx || ctx.state !== 'running') return false;

  const def = TONES.find((tone) => tone.id === id) ?? TONES[0];
  const now = ctx.currentTime;

  for (const note of def.notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = def.wave;
    osc.frequency.value = note.hz;

    // A short attack and an exponential decay: without the ramp every note
    // starts and ends with an audible click.
    const start = now + note.at;
    const end = start + note.for;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.28), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
  return true;
}
