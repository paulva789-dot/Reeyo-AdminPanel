import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AlertsContext, DEFAULT_ALERTS, ALERT_KEY,
} from './useAlerts';
import type { AlertSettings } from './useAlerts';
import { useAppState } from './useAppState';
import { playTone, unlockSound, soundIsUnlocked, PRIORITY_TONE } from '../lib/tones';
import type { ToneId } from '../lib/tones';
import type { Order, Vertical } from '../data/types';

const REPEAT_MS = 20_000;
const BASE_TITLE = 'reeyo — Operations Console';

function readSettings(): AlertSettings {
  try {
    const raw = window.localStorage.getItem(ALERT_KEY);
    if (!raw) return DEFAULT_ALERTS;
    const parsed = JSON.parse(raw) as Partial<AlertSettings>;
    return {
      ...DEFAULT_ALERTS,
      ...parsed,
      tones: { ...DEFAULT_ALERTS.tones, ...(parsed.tones ?? {}) },
    };
  } catch {
    return DEFAULT_ALERTS;
  }
}

function writeSettings(settings: AlertSettings): void {
  try {
    window.localStorage.setItem(ALERT_KEY, JSON.stringify(settings));
  } catch {
    // A preference that cannot be saved still applies for this session.
  }
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { orders, pushToast } = useAppState();
  const [settings, setSettings] = useState<AlertSettings>(readSettings);
  const [unlocked, setUnlocked] = useState(soundIsUnlocked);

  const waiting = orders.filter((o) => !o.acknowledged).length;

  // Which orders have already been announced, so a re-render does not ring.
  const announced = useRef<Set<string>>(new Set());
  const repeats = useRef(0);
  const timer = useRef<number | null>(null);
  const first = useRef(true);

  const save = useCallback((next: AlertSettings) => {
    setSettings(next);
    writeSettings(next);
  }, []);

  const stopRepeat = useCallback(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    repeats.current = 0;
  }, []);

  const ring = useCallback((order: Order) => {
    // A late or escalated order gets the distinct, more urgent tone.
    const tone: ToneId = order.isLate
      ? PRIORITY_TONE
      : settings.tones[order.vertical as Vertical] ?? DEFAULT_ALERTS.tones.food;
    return playTone(tone, settings.volume / 100);
  }, [settings]);

  // Announce orders that arrive while the console is open.
  useEffect(() => {
    const fresh = orders.filter((o) => !o.acknowledged && !announced.current.has(o.id));
    if (fresh.length === 0) return;

    for (const order of fresh) announced.current.add(order.id);

    // The orders already on screen at load are not new arrivals; ringing for
    // twenty of them the moment someone signs in would train them to mute it.
    if (first.current) {
      first.current = false;
      return;
    }

    const newest = fresh[0];
    // The toast and the badge land whether or not the sound does, which is the
    // §2.4 fallback: the alert must arrive even when audio is blocked.
    pushToast(`New order ${newest.id}`);
    ring(newest);

    if (settings.repeat) {
      stopRepeat();
      repeats.current = 0;
      timer.current = window.setInterval(() => {
        repeats.current += 1;
        if (repeats.current >= settings.maxRepeats) {
          stopRepeat();
          return;
        }
        ring(newest);
      }, REPEAT_MS);
    }
  }, [orders, ring, settings.repeat, settings.maxRepeats, pushToast, stopRepeat]);

  // Nothing is waiting any more, so stop asking.
  useEffect(() => {
    if (waiting === 0) stopRepeat();
  }, [waiting, stopRepeat]);

  useEffect(() => stopRepeat, [stopRepeat]);

  // The tab title carries the count, so the alert lands even in a background
  // tab where neither the toast nor the badge can be seen.
  useEffect(() => {
    document.title = waiting > 0 ? `(${waiting}) ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [waiting]);

  const enableSound = useCallback(() => {
    void unlockSound().then((ok) => {
      setUnlocked(ok);
      if (ok) playTone(settings.tones.food, settings.volume / 100);
    });
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    setTone: (vertical: Vertical, tone: ToneId) =>
      save({ ...settings, tones: { ...settings.tones, [vertical]: tone } }),
    setVolume: (volume: number) => save({ ...settings, volume }),
    setRepeat: (repeat: boolean) => save({ ...settings, repeat }),
    unlocked,
    enableSound,
    preview: (tone: ToneId) => {
      if (!playTone(tone, Math.max(settings.volume, 20) / 100)) enableSound();
    },
    waiting,
    acknowledge: stopRepeat,
  }), [settings, save, unlocked, enableSound, waiting, stopRepeat]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}
