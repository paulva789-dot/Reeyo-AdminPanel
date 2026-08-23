// One typed loader per collection the backend actually serves. Each returns
// console-shaped rows, so pages never see an admin-api payload directly.

import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import {
  adaptOrder, adaptVendor, adaptRider, adaptCustomer,
  adaptPayment, adaptPayoutRequest, adaptDispute, adaptApproval, adaptApiKey,
  toArray,
} from './adapters';
import type {
  Order, Vendor, Rider, Customer, Payment, PayoutRequest, OrderStatus,
  Dispute, MenuApproval, ApiKey,
} from '../data/types';

/**
 * Rows are keyed by `id` throughout the console. If a payload omits every id
 * field the adapters fall back to a placeholder, which would give every row the
 * same key and break React's reconciliation — so duplicates are made unique
 * here rather than silently corrupting the tables.
 */
function ensureUniqueIds<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.map((row, i) => {
    if (!row.id || seen.has(row.id)) {
      const id = `${row.id || 'row'}-${i + 1}`;
      seen.add(id);
      return { ...row, id };
    }
    seen.add(row.id);
    return row;
  });
}

async function list<T extends { id: string }>(
  path: string,
  adapt: (row: Record<string, unknown>) => T,
  params?: Record<string, string | number>,
): Promise<T[]> {
  const res = await apiClient.get<unknown>(path, params);
  return ensureUniqueIds(toArray(res.data).map(adapt));
}

export const resources = {
  orders: (params?: { status?: string; limit?: number }) =>
    list<Order>(ENDPOINTS.orders, adaptOrder, { limit: 100, ...params }),

  searchOrders: (q: string) =>
    list<Order>(ENDPOINTS.orderSearch, adaptOrder, { q }),

  vendors: () => list<Vendor>(ENDPOINTS.vendors, adaptVendor, { limit: 100 }),

  riders: () => list<Rider>(ENDPOINTS.riders, adaptRider, { limit: 100 }),

  customers: () => list<Customer>(ENDPOINTS.users, adaptCustomer, { limit: 100 }),

  payments: () => list<Payment>(ENDPOINTS.payouts, adaptPayment, { limit: 100 }),

  payoutRequests: () =>
    list<PayoutRequest>(ENDPOINTS.payoutRequests, adaptPayoutRequest, { limit: 100 }),

  disputes: () => list<Dispute>(ENDPOINTS.disputes, adaptDispute, { limit: 100 }),

  menuApprovals: () =>
    list<MenuApproval>(ENDPOINTS.menuApprovals, adaptApproval, { limit: 100 }),

  apiKeys: () => list<ApiKey>(ENDPOINTS.apiKeys, adaptApiKey),

  /** Mutations — the console's own writes, not adapted on the way back. */

  resolveDispute: (id: string, resolution: string, refundAmount?: number) =>
    apiClient.post(ENDPOINTS.resolveDispute(id), {
      resolution,
      refundAmount: refundAmount || undefined,
      refundToWallet: false,
    }),

  rejectDispute: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.rejectDispute(id), { reason }),

  replyToDispute: (id: string, message: string) =>
    apiClient.post(ENDPOINTS.disputeMessages(id), { message }),

  approveMenu: (id: string) => apiClient.post(ENDPOINTS.approveMenu(id)),

  rejectMenu: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.rejectMenu(id), { reason }),

  /** Returns the raw key, which the backend shows exactly once. */
  createApiKey: (name: string, scopes: string[], expiresAt?: string) =>
    apiClient.post<{ rawKey?: string; key?: string } & Record<string, unknown>>(
      ENDPOINTS.apiKeys,
      { name, scopes, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined },
    ),

  revokeApiKey: (id: string) => apiClient.delete(ENDPOINTS.apiKey(id)),

  setOrderStatus: (id: string, status: OrderStatus) =>
    apiClient.patch(`${ENDPOINTS.orders}/${id}`, { status }),

  assignRider: (orderId: string, riderId: string) =>
    apiClient.post(`${ENDPOINTS.orders}/${orderId}/assign-rider`, { riderId }),

  approvePayout: (id: string) =>
    apiClient.post(`${ENDPOINTS.payoutRequests}/${id}/approve`),

  declinePayout: (id: string, reason: string) =>
    apiClient.post(`${ENDPOINTS.payoutRequests}/${id}/decline`, { reason }),
};
