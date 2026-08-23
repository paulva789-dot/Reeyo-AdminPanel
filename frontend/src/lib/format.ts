import type { OrderStatus, Vertical } from '../data/types';

/** Signal tokens — section 3.3. There is no fifth. */
export type SignalToken = 'go' | 'watch' | 'stop' | 'calm' | 'parcel';

/**
 * U+202F NARROW NO-BREAK SPACE, not U+2009 THIN SPACE.
 *
 * Both render as the thin gap section 1 asks for, but U+2009 is breaking: in
 * a narrow table cell "FCFA 2 140 000" wraps mid-number and the figure reads
 * as two. The no-break variant keeps every amount on one line, which is the
 * whole point of the mono, tabular treatment in section 4.
 */
const THIN_SPACE = ' ';

/** 2140000 -> "2 140 000". Thin space, never a comma — section 1. */
export function money(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  const grouped = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  return amount < 0 ? `-${grouped}` : grouped;
}

/** 2140000 -> "FCFA 2 140 000". The prefix renders at 12px --text-3 in the UI. */
export function fcfa(amount: number): string {
  return `FCFA ${money(amount)}`;
}

/** "Anna Mbella" -> "AM" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Status -> token map, section 5.5. */
const STATUS_TOKENS: Record<string, SignalToken> = {
  new: 'parcel',
  accepted: 'parcel',
  preparing: 'watch',
  ready: 'watch',
  'on the way': 'go',
  delivered: 'go',
  cancelled: 'stop',
  delayed: 'stop',
  completed: 'go',
  paid: 'go',
  active: 'go',
  pending: 'watch',
  due: 'watch',
  review: 'watch',
  failed: 'stop',
  suspended: 'stop',
  idle: 'calm',
  archived: 'calm',
  // Disputes and menu approvals. All four fit go / watch / stop; section 3.3
  // forbids inventing a fifth signal for them.
  open: 'watch',
  resolved: 'go',
  rejected: 'stop',
  approved: 'go',
  high: 'stop',
  normal: 'calm',
  low: 'calm',
  'price update': 'watch',
  'new item': 'parcel',
};

export function statusToken(status: string): SignalToken {
  return STATUS_TOKENS[status.toLowerCase()] ?? 'calm';
}

/** Pads a count for the order-flow rail: 4 -> "04" — section 8.1a. */
export function padCount(n: number): string {
  return n.toString().padStart(2, '0');
}

export function verticalLabel(vertical: Vertical): string {
  return vertical.charAt(0).toUpperCase() + vertical.slice(1);
}

/** An ETA is late when it reads "late 14 min" — section 8.2 renders those in --stop. */
export function isLate(eta: string): boolean {
  return eta.toLowerCase().startsWith('late');
}

export const ORDER_STAGES: OrderStatus[] = [
  'new',
  'accepted',
  'preparing',
  'ready',
  'on the way',
  'delivered',
];
