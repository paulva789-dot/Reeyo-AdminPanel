// One typed loader per collection the backend actually serves. Each returns
// console-shaped rows, so pages never see an admin-api payload directly.

import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import {
  adaptOrder, adaptVendor, adaptRider, adaptCustomer,
  adaptPayment, adaptPayoutRequest, toArray,
} from './adapters';
import type {
  Order, Vendor, Rider, Customer, Payment, PayoutRequest, OrderStatus,
} from '../data/types';

async function list<T>(path: string, adapt: (row: Record<string, unknown>) => T,
  params?: Record<string, string | number>): Promise<T[]> {
  const res = await apiClient.get<unknown>(path, params);
  return toArray(res.data).map(adapt);
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

  /** Mutations — the console's own writes, not adapted on the way back. */
  setOrderStatus: (id: string, status: OrderStatus) =>
    apiClient.patch(`${ENDPOINTS.orders}/${id}`, { status }),

  assignRider: (orderId: string, riderId: string) =>
    apiClient.post(`${ENDPOINTS.orders}/${orderId}/assign-rider`, { riderId }),

  approvePayout: (id: string) =>
    apiClient.post(`${ENDPOINTS.payoutRequests}/${id}/approve`),

  declinePayout: (id: string, reason: string) =>
    apiClient.post(`${ENDPOINTS.payoutRequests}/${id}/decline`, { reason }),
};
