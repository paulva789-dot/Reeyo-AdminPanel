// The stage list and its predicates, apart from the component that draws them,
// so the rail keeps Fast Refresh.

import type { Order, OrderStatus } from '../../data/types';

export type Stage =
  | 'new' | 'accepted' | 'preparing' | 'ready' | 'on the way' | 'delivered' | 'problem';

export interface StageDef {
  key: Stage;
  label: string;
  token: string;
}

export const STAGES: StageDef[] = [
  { key: 'new', label: 'New', token: 'parcel' },
  { key: 'accepted', label: 'Accepted', token: 'parcel' },
  { key: 'preparing', label: 'Preparing', token: 'watch' },
  { key: 'ready', label: 'Ready', token: 'watch' },
  { key: 'on the way', label: 'On the way', token: 'go' },
  { key: 'delivered', label: 'Delivered', token: 'go' },
  { key: 'problem', label: 'Problem', token: 'stop' },
];

/** Problem folds delayed and cancelled together — section 8.1a. */
export function matchesStage(order: Order, stage: Stage): boolean {
  if (stage === 'problem') return order.status === 'delayed' || order.status === 'cancelled';
  return order.status === (stage as OrderStatus);
}

export function countForStage(orders: Order[], stage: Stage): number {
  return orders.filter((o) => matchesStage(o, stage)).length;
}

