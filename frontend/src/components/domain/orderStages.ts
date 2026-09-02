// The stage list and its predicates, apart from the component that draws them,
// so the rail keeps Fast Refresh.

import { ORDER_FLOW } from '../../data/types';
import type { Order, OrderStatus } from '../../data/types';

/**
 * The rail's stages: the seven of spec §3.2 the order moves through, plus one
 * that folds every way an order can be in trouble.
 *
 * Deriving the first seven from ORDER_FLOW rather than restating them is the
 * point — this list drifted out of step with the workflow once already, and
 * every stage that no longer existed silently read 00 forever.
 */
export type Stage = OrderStatus | 'problem';

export interface StageDef {
  key: Stage;
  label: string;
  token: string;
}

/** Short labels, because the rail gives each stage about seven characters. */
const LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  'ready for pickup': 'Ready',
  'rider assigned': 'Assigned',
  'picked up': 'Picked up',
  'in transit': 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

/** Waiting on someone reads as watch, moving reads as go. */
const TOKEN: Record<OrderStatus, string> = {
  pending: 'watch',
  confirmed: 'parcel',
  'ready for pickup': 'watch',
  'rider assigned': 'parcel',
  'picked up': 'go',
  'in transit': 'go',
  delivered: 'go',
  cancelled: 'stop',
  failed: 'stop',
};

export const STAGES: StageDef[] = [
  ...ORDER_FLOW.map((key) => ({ key, label: LABEL[key], token: TOKEN[key] })),
  { key: 'problem' as Stage, label: 'Problem', token: 'stop' },
];

/**
 * Problem folds the two terminal failures together with the running-late flag:
 * a late order is still in transit, but it is a problem.
 */
export function matchesStage(order: Order, stage: Stage): boolean {
  if (stage === 'problem') {
    return order.status === 'cancelled' || order.status === 'failed' || order.isLate;
  }
  return order.status === (stage as OrderStatus);
}

export function countForStage(orders: Order[], stage: Stage): number {
  return orders.filter((o) => matchesStage(o, stage)).length;
}

