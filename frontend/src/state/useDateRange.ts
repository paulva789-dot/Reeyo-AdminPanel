// The date range — specification §2.3.
//
// One component, one piece of state, shared by every list and report screen.
// The range persists while navigating between screens in the same session,
// which is why it lives here rather than in each page.

import { createContext, useContext } from 'react';

export type PresetKey =
  | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  preset: PresetKey;
  /** Inclusive, local midnight. */
  from: Date;
  /** Inclusive, local end of day. */
  to: Date;
}

export interface DateRangeValue {
  range: DateRange;
  setPreset: (preset: Exclude<PresetKey, 'custom'>) => void;
  setCustom: (from: Date, to: Date) => void;
}

export const DateRangeContext = createContext<DateRangeValue | null>(null);

export function useDateRange(): DateRangeValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider');
  return ctx;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function rangeFor(preset: Exclude<PresetKey, 'custom'>, now = new Date()): DateRange {
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return { preset, from: today, to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { preset, from: y, to: endOfDay(y) };
    }
    case 'last7': {
      const from = new Date(today);
      // Seven days including today, which is what an operator means by it.
      from.setDate(from.getDate() - 6);
      return { preset, from, to: endOfDay(now) };
    }
    case 'last30': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { preset, from, to: endOfDay(now) };
    }
    case 'thisMonth': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { preset, from, to: endOfDay(now) };
    }
    case 'lastMonth': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
      return { preset, from, to };
    }
  }
}

export function customRange(from: Date, to: Date): DateRange {
  // Reversed handles are a slip, not an empty range.
  const [a, b] = from <= to ? [from, to] : [to, from];
  return { preset: 'custom', from: startOfDay(a), to: endOfDay(b) };
}

/** Whether a timestamp falls inside the range. Undated records are kept. */
export function withinRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return true;
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return true;
  return at >= range.from.getTime() && at <= range.to.getTime();
}

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/** The chip label, so an operator always knows what they are looking at. */
export function describeRange(range: DateRange, locale: string): string {
  const from = range.from.toLocaleDateString(locale, DAY_MONTH);
  const to = range.to.toLocaleDateString(locale, DAY_MONTH);
  return from === to ? from : `${from} – ${to}`;
}

/** yyyy-mm-dd, for a date input and for export filenames. */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
