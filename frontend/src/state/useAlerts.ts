// Incoming-order alerts — specification §2.4.

import { createContext, useContext } from 'react';
import type { ToneId } from '../lib/tones';
import type { Vertical } from '../data/types';

export interface AlertSettings {
  /** A tone per service, so an operator knows which one landed without looking. */
  tones: Record<Vertical, ToneId>;
  /** 0–100. Mute is allowed, and shows a persistent warning badge. */
  volume: number;
  /** Repeat until acknowledged, capped so it cannot ring forever. */
  repeat: boolean;
  maxRepeats: number;
}

export const DEFAULT_ALERTS: AlertSettings = {
  tones: { food: 'bell', grocery: 'marimba', parcel: 'chime' },
  volume: 70,
  repeat: true,
  maxRepeats: 3,
};

export interface AlertsValue {
  settings: AlertSettings;
  setTone: (vertical: Vertical, tone: ToneId) => void;
  setVolume: (volume: number) => void;
  setRepeat: (repeat: boolean) => void;

  /** Whether the browser is letting sound through yet. */
  unlocked: boolean;
  /** Asks the browser for permission, from a real click. */
  enableSound: () => void;
  /** Plays a tone now, for the preview buttons in Settings. */
  preview: (tone: ToneId) => void;

  /** How many orders have arrived and not been opened. */
  waiting: number;
  /** Silences the current repeat without opening anything. */
  acknowledge: () => void;
}

export const AlertsContext = createContext<AlertsValue | null>(null);

export function useAlerts(): AlertsValue {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
}

export const ALERT_KEY = 'reeyo.alerts';
