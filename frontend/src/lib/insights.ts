// Everything the console claims about the platform is derived here from the
// rows actually loaded. Nothing in this file may hardcode a vendor, rider,
// zone or figure: against live data those would be fabricated claims about
// entities that might not exist.

import type { Order, Vendor, Rider, Customer, PayoutRequest } from '../data/types';
import { money } from './format';

export interface Alert {
  id: string;
  text: string;
  token: 'stop' | 'watch' | 'go';
  to: string;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Groups a list by a key and returns the largest bucket. */
function biggestGroup<T>(rows: T[], key: (row: T) => string): { name: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!best || count > best.count) best = { name, count };
  }
  return best;
}

const LOW_RATING = 4.2;

/**
 * The "needs attention" list. Each entry is only produced when the underlying
 * rows justify it, so an empty platform yields an empty list rather than
 * invented problems.
 */
export function deriveAlerts(
  orders: Order[],
  vendors: Vendor[],
  riders: Rider[],
  payouts: PayoutRequest[],
): Alert[] {
  const alerts: Alert[] = [];

  const pending = payouts.filter((p) => p.status === 'pending');
  if (pending.length > 0) {
    const total = pending.reduce((sum, p) => sum + p.amount, 0);
    const oldest = pending
      .map((p) => p.date)
      .filter((d) => d && d !== '—')
      .sort()[0];
    const days = oldest
      ? Math.max(0, Math.round((Date.now() - new Date(oldest).getTime()) / 86_400_000))
      : null;
    alerts.push({
      id: 'payouts',
      text: days !== null && Number.isFinite(days)
        ? `FCFA ${money(total)} waiting, oldest is ${plural(days, 'day')}`
        : `FCFA ${money(total)} waiting across ${plural(pending.length, 'request')}`,
      token: 'watch',
      to: '/payments',
    });
  }

  const late = orders.filter((o) => o.isLate);
  if (late.length > 0) {
    const zone = biggestGroup(late, (o) => o.zone);
    alerts.push({
      id: 'late',
      text: zone && zone.count === late.length
        ? `${plural(late.length, 'order')} running late in ${zone.name}`
        : `${plural(late.length, 'order')} running late`,
      token: 'stop',
      to: '/orders',
    });
  }

  const unassigned = orders.filter(
    (o) => o.rider === null && o.status !== 'cancelled' && o.status !== 'delivered',
  );
  if (unassigned.length > 0) {
    alerts.push({
      id: 'unassigned',
      text: `${plural(unassigned.length, 'order')} without a rider`,
      token: 'watch',
      to: '/dispatch',
    });
  }

  const suspended = vendors.filter((v) => v.status === 'suspended');
  if (suspended.length === 1) {
    alerts.push({
      id: 'suspended',
      text: `${suspended[0].name} is suspended and still listed`,
      token: 'stop',
      to: '/vendors',
    });
  } else if (suspended.length > 1) {
    alerts.push({
      id: 'suspended',
      text: `${plural(suspended.length, 'vendor')} suspended and still listed`,
      token: 'stop',
      to: '/vendors',
    });
  }

  const inReview = vendors.filter((v) => v.status === 'review');
  if (inReview.length > 0) {
    alerts.push({
      id: 'review',
      text: inReview.length === 1
        ? `${inReview[0].name} is waiting on a review`
        : `${plural(inReview.length, 'vendor')} waiting on a review`,
      token: 'watch',
      to: '/vendors',
    });
  }

  const poorlyRated = riders.filter((r) => r.rating > 0 && r.rating < LOW_RATING);
  if (poorlyRated.length === 1) {
    const r = poorlyRated[0];
    alerts.push({
      id: 'rating',
      text: `${r.name} is rated ${r.rating} across ${plural(r.trips, 'trip')}`,
      token: 'watch',
      to: '/riders',
    });
  } else if (poorlyRated.length > 1) {
    alerts.push({
      id: 'rating',
      text: `${plural(poorlyRated.length, 'rider')} rated below ${LOW_RATING}`,
      token: 'watch',
      to: '/riders',
    });
  }

  return alerts;
}

/* ---- Figures derived from loaded rows ---------------------------------- */

export function grossValue(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.total, 0);
}

export function cancelRate(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  return Math.round((cancelled / orders.length) * 100);
}

export function averageBasket(orders: Order[]): number {
  const billable = orders.filter((o) => o.status !== 'cancelled');
  if (billable.length === 0) return 0;
  return Math.round(grossValue(billable) / billable.length);
}

/** Parses "8 min" / "late 14 min" back to a number, ignoring "done" and "—". */
function etaMinutes(eta: string): number | null {
  const match = eta.match(/(\d+)\s*min/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Average ETA across orders still moving. Null when nothing is in flight. */
export function averageEta(orders: Order[]): number | null {
  const values = orders
    .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    .map((o) => etaMinutes(o.eta))
    .filter((n): n is number => n !== null);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function ratingAverage(rows: { rating: number }[]): number | null {
  const rated = rows.filter((r) => r.rating > 0);
  if (rated.length === 0) return null;
  return Number((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1));
}

export function topVendorsByRevenue(vendors: Vendor[], limit = 5) {
  return [...vendors]
    .filter((v) => v.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((v) => ({ label: v.name, value: v.revenue, token: v.vertical }));
}

export function revenueByVertical(orders: Order[]) {
  const totals: Record<string, number> = { food: 0, grocery: 0, parcel: 0 };
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    totals[o.vertical] = (totals[o.vertical] ?? 0) + o.total;
  }
  return (['food', 'grocery', 'parcel'] as const)
    .map((v) => ({
      label: v.charAt(0).toUpperCase() + v.slice(1),
      value: totals[v],
      token: v,
    }))
    .filter((slice) => slice.value > 0);
}

export function segmentCounts(customers: Customer[]) {
  return {
    loyal: customers.filter((c) => c.segment === 'loyal').length,
    active: customers.filter((c) => c.segment === 'active').length,
    fresh: customers.filter((c) => c.segment === 'new').length,
    lapsed: customers.filter((c) => c.segment === 'lapsed').length,
  };
}

/** Average delivery time per zone, from orders that carry a usable ETA. */
export function deliveryByZone(orders: Order[]) {
  const buckets = new Map<string, number[]>();
  for (const o of orders) {
    const mins = etaMinutes(o.eta);
    if (mins === null) continue;
    const list = buckets.get(o.zone) ?? [];
    list.push(mins);
    buckets.set(o.zone, list);
  }
  return [...buckets.entries()]
    .map(([label, values]) => ({
      label,
      value: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => a.value - b.value);
}

/** Riders ranked by completed trips — the local stand-in for /analytics/top-riders. */
export function topRidersByTrips(riders: Rider[], limit = 5) {
  return [...riders]
    .filter((r) => r.trips > 0)
    .sort((a, b) => b.trips - a.trips)
    .slice(0, limit)
    .map((r) => ({ label: r.name, value: r.trips, token: 'parcel' }));
}

/** How the loaded orders split by status — the stand-in for /analytics/order-status. */
export function orderStatusCounts(orders: Order[]) {
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
