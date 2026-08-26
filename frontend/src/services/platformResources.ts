// Loaders and writes for the platform-administration half of admin-api.
// Paths come from docs/ADMIN-API-ENDPOINT-REFERENCE.md; SuperAdmin-only routes
// are marked so the console can gate the control rather than let it 403.

import { apiClient } from './apiClient';
import { ENDPOINTS } from './endpoints';
import { toArray, adaptOrder } from './adapters';
import type { Raw } from './adapters';
import {
  adaptPendingVendor, adaptPendingRider, adaptPlatformStats, adaptRevenuePoint,
  adaptRanked, adaptOrderStatusCount, adaptLiveSnapshot, adaptZone, adaptBanner,
  adaptPopup, adaptSpinWheel, adaptLoyaltyRule, adaptLoyaltyReward,
  adaptPreferenceTag, adaptTrackingFact, adaptSharedCart, adaptAdminUser,
  adaptConfig, adaptFeatureFlag, adaptTimelineEvent, adaptRiderLocation,
  adaptSpinResult, adaptLoyaltyAccount, adaptLoyaltyEntry, adaptPopupStats,
} from './platformAdapters';
import type {
  PendingVendor, PendingRider, RiderDocumentType,
  PlatformStats, RevenuePoint, RankedEntity, OrderStatusCount, LiveSnapshot,
  DeliveryZone, RiderLocation, EngagementBanner, Popup, SpinWheel, LoyaltyRule, LoyaltyReward,
  PreferenceTag, TrackingFact, SharedCart, AdminUser, AdminRole, AdminStatus,
  SpinResult, LoyaltyAccount, LoyaltyEntry, PopupStats,
  PlatformConfig, FeatureFlag, TimelineEvent, MenuItem, Order,
} from '../data/types';

async function list<T>(
  path: string,
  adapt: (row: Raw) => T,
  params?: Record<string, string | number>,
): Promise<T[]> {
  const res = await apiClient.get<unknown>(path, params);
  return toArray(res.data).map(adapt);
}

async function one<T>(path: string, adapt: (payload: unknown) => T): Promise<T> {
  const res = await apiClient.get<unknown>(path);
  return adapt(res.data);
}

/** One decision per rider document, submitted together. */
export interface DocumentVerdict {
  document_type: RiderDocumentType;
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export const platform = {
  /* ---- Approval queues ------------------------------------------------- */

  pendingVendors: () =>
    list<PendingVendor>(ENDPOINTS.vendors, adaptPendingVendor, { limit: 100 }),

  pendingRiders: () =>
    list<PendingRider>(ENDPOINTS.riders, adaptPendingRider, { limit: 100 }),

  approveVendor: (id: string) => apiClient.post(ENDPOINTS.approveVendor(id)),
  rejectVendor: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.rejectVendor(id), { reason }),
  suspendVendor: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.suspendVendor(id), { reason }),
  featureVendor: (id: string, featured: boolean) =>
    apiClient.patch(ENDPOINTS.featureVendor(id), { featured }),
  setVendorCommission: (id: string, commissionRate: number) =>
    apiClient.patch(ENDPOINTS.vendorCommission(id), { commissionRate }),

  updateVendor: (id: string, patch: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.updateVendor(id), patch),
  updateRider: (id: string, patch: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.updateRider(id), patch),

  approveRider: (id: string) => apiClient.post(ENDPOINTS.approveRider(id)),
  rejectRider: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.rejectRider(id), { reason }),
  suspendRider: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.suspendRider(id), { reason }),

  /**
   * Verifying documents does NOT change the rider's overall approval status —
   * the reference is explicit about that. Approving the rider is a separate
   * call once every document has been reviewed.
   */
  verifyRiderDocuments: (id: string, decisions: DocumentVerdict[]) =>
    apiClient.post(ENDPOINTS.verifyRiderDocuments(id), { decisions }),

  /* ---- Customers ------------------------------------------------------- */

  suspendUser: (id: string, reason: string) =>
    apiClient.post(ENDPOINTS.suspendUser(id), { reason }),
  unsuspendUser: (id: string) => apiClient.post(ENDPOINTS.unsuspendUser(id)),
  deleteUser: (id: string) => apiClient.delete(ENDPOINTS.deleteUser(id)),

  /* ---- Analytics ------------------------------------------------------- */

  platformStats: () => one<PlatformStats>(ENDPOINTS.analyticsPlatform, adaptPlatformStats),
  revenue: () => list<RevenuePoint>(ENDPOINTS.analyticsRevenue, adaptRevenuePoint),
  topVendors: () => list<RankedEntity>(ENDPOINTS.analyticsTopVendors, adaptRanked),
  topRiders: () => list<RankedEntity>(ENDPOINTS.analyticsTopRiders, adaptRanked),
  orderStatusBreakdown: () =>
    list<OrderStatusCount>(ENDPOINTS.analyticsOrderStatus, adaptOrderStatusCount),
  liveSnapshot: () => one<LiveSnapshot>(ENDPOINTS.analyticsLive, adaptLiveSnapshot),

  /* ---- Logistics ------------------------------------------------------- */

  zones: () => list<DeliveryZone>(ENDPOINTS.zones, adaptZone),
  createZone: (zone: Omit<DeliveryZone, 'id'>) =>
    apiClient.post(ENDPOINTS.zones, {
      name: zone.name,
      countryCode: zone.countryCode,
      polygon: zone.polygon,
      deliveryFeeOverride: zone.deliveryFeeOverride ?? undefined,
      isActive: zone.isActive,
    }),
  updateZone: (id: string, patch: Partial<Omit<DeliveryZone, 'id'>>) =>
    apiClient.patch(ENDPOINTS.zone(id), patch),
  deleteZone: (id: string) => apiClient.delete(ENDPOINTS.zone(id)),

  /**
   * Where every rider is right now. Polled rather than streamed — the API
   * offers no socket — so the caller decides the interval.
   */
  riderLocations: (country?: string) =>
    list<RiderLocation>(
      ENDPOINTS.riderLiveLocations,
      adaptRiderLocation,
      country ? { country } : undefined,
    ),

  /* ---- Engagement — writes are SuperAdmin ------------------------------ */

  banners: () => list<EngagementBanner>(ENDPOINTS.banners, adaptBanner),
  createBanner: (body: Record<string, unknown>) =>
    apiClient.post(ENDPOINTS.banners, body),
  updateBanner: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.banner(id), body),
  deleteBanner: (id: string) => apiClient.delete(ENDPOINTS.banner(id)),

  popups: () => list<Popup>(ENDPOINTS.popups, adaptPopup),
  createPopup: (body: Record<string, unknown>) => apiClient.post(ENDPOINTS.popups, body),
  updatePopup: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.popup(id), body),
  deletePopup: (id: string) => apiClient.delete(ENDPOINTS.popup(id)),

  spinWheels: () => list<SpinWheel>(ENDPOINTS.spinWheels, adaptSpinWheel),
  updateSpinWheel: (id: string, body: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.spinWheel(id), body),

  popupStats: (id: string) => one<PopupStats>(ENDPOINTS.popupStats(id), adaptPopupStats),

  /**
   * Spin wheels. The wheel and its slices are separate resources — a slice is
   * added to and removed from an existing wheel, never sent as part of it.
   */
  createSpinWheel: (name: string) =>
    apiClient.post(ENDPOINTS.spinWheels, { name, isActive: false }),
  deleteSpinWheel: (id: string) => apiClient.delete(ENDPOINTS.spinWheel(id)),
  addSpinWheelSegment: (
    id: string,
    segment: { label: string; weight: number; rewardType: string },
  ) => apiClient.post(ENDPOINTS.spinWheelSegments(id), segment),
  deleteSpinWheelSegment: (id: string, segmentId: string) =>
    apiClient.delete(ENDPOINTS.spinWheelSegment(id, segmentId)),
  spinWheelResults: (id: string) =>
    list<SpinResult>(ENDPOINTS.spinWheelResults(id), adaptSpinResult, { limit: 50 }),

  loyaltyRules: () => list<LoyaltyRule>(ENDPOINTS.loyaltyRules, adaptLoyaltyRule),
  createLoyaltyRule: (name: string, pointsPerOrder: number) =>
    apiClient.post(ENDPOINTS.loyaltyRules, { name, pointsPerOrder, isActive: true }),
  deleteLoyaltyRule: (id: string) => apiClient.delete(ENDPOINTS.loyaltyRule(id)),

  loyaltyRewards: () => list<LoyaltyReward>(ENDPOINTS.loyaltyRewards, adaptLoyaltyReward),
  createLoyaltyReward: (body: { name: string; pointsCost: number; imageUrl?: string }) =>
    apiClient.post(ENDPOINTS.loyaltyRewards, { ...body, isActive: true }),
  updateLoyaltyReward: (id: string, patch: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.loyaltyReward(id), patch),
  deleteLoyaltyReward: (id: string) => apiClient.delete(ENDPOINTS.loyaltyReward(id)),

  /** One customer's points balance, and how they got there. */
  loyaltyAccount: (userId: string) =>
    one<LoyaltyAccount>(ENDPOINTS.loyaltyAccount(userId), adaptLoyaltyAccount),
  loyaltyLedger: (userId: string) =>
    list<LoyaltyEntry>(ENDPOINTS.loyaltyLedger(userId), adaptLoyaltyEntry, { limit: 50 }),

  preferenceTags: () => list<PreferenceTag>(ENDPOINTS.preferenceTags, adaptPreferenceTag),
  createPreferenceTag: (tag: string) => apiClient.post(ENDPOINTS.preferenceTags, { tag }),
  deletePreferenceTag: (tag: string) => apiClient.delete(ENDPOINTS.preferenceTag(tag)),

  trackingFacts: () => list<TrackingFact>(ENDPOINTS.trackingFacts, adaptTrackingFact),
  createTrackingFact: (text: string) =>
    apiClient.post(ENDPOINTS.trackingFacts, { text, isActive: true }),
  updateTrackingFact: (id: string, patch: { text?: string; isActive?: boolean }) =>
    apiClient.patch(ENDPOINTS.trackingFact(id), patch),
  deleteTrackingFact: (id: string) => apiClient.delete(ENDPOINTS.trackingFact(id)),

  sharedCarts: () => list<SharedCart>(ENDPOINTS.sharedCarts, adaptSharedCart),

  setVendorBadges: (id: string, badges: string[]) =>
    apiClient.patch(ENDPOINTS.vendorBadges(id), { badges }),
  setMenuItemUpsell: (itemId: string, isUpsell: boolean) =>
    apiClient.patch(ENDPOINTS.menuItemUpsell(itemId), { is_upsell: isUpsell }),

  /* ---- Broadcast ------------------------------------------------------- */

  broadcast: (
    audience: 'users' | 'vendors' | 'riders',
    title: string,
    body: string,
  ) => {
    const path = audience === 'users' ? ENDPOINTS.broadcastUsers
      : audience === 'vendors' ? ENDPOINTS.broadcastVendors
        : ENDPOINTS.broadcastRiders;
    // Omitting the id list means everyone in that audience.
    return apiClient.post(path, { title, body });
  },

  /* ---- Detail views ---------------------------------------------------- */

  orderTimeline: async (id: string): Promise<TimelineEvent[]> => {
    const res = await apiClient.get<unknown>(ENDPOINTS.orderTimeline(id));
    return toArray(res.data).map((row, i) => adaptTimelineEvent(row, i));
  },

  /** A customer's, a vendor's or a rider's own order history. */
  userOrders: (id: string) => list<Order>(ENDPOINTS.userOrders(id), adaptOrder, { limit: 50 }),
  vendorOrders: (id: string) => list<Order>(ENDPOINTS.vendorOrders(id), adaptOrder, { limit: 50 }),
  riderDeliveries: (id: string) =>
    list<Order>(ENDPOINTS.riderDeliveries(id), adaptOrder, { limit: 50 }),

  vendorMenuItems: async (id: string): Promise<MenuItem[]> => {
    const res = await apiClient.get<unknown>(ENDPOINTS.vendorMenuItems(id));
    return toArray(res.data).map((row, i) => {
      const price = Number(row.price ?? row.amount ?? 0);
      const was = row.compare_at_price ?? row.original_price ?? row.was_price;
      return {
        id: String(row.id ?? row._id ?? `item-${i + 1}`),
        name: String(row.name ?? row.title ?? '—'),
        price: Number.isFinite(price) ? price : 0,
        wasPrice: was === undefined || was === null ? null : Number(was),
        stock: Number(row.stock ?? row.quantity ?? 0),
        addOns: Array.isArray(row.add_ons) ? row.add_ons.length : Number(row.add_ons ?? 0),
        available: row.is_available === undefined ? true : Boolean(row.is_available),
      } satisfies MenuItem;
    });
  },

  /* ---- Admin users — SuperAdmin ---------------------------------------- */

  adminUsers: () => list<AdminUser>(ENDPOINTS.adminUsers, adaptAdminUser),
  createAdmin: (email: string, name: string, role: AdminRole) =>
    apiClient.post(ENDPOINTS.adminUsers, { email, name, role }),
  updateAdmin: (id: string, patch: { role?: AdminRole; status?: AdminStatus }) =>
    apiClient.patch(ENDPOINTS.adminUser(id), patch),
  deleteAdmin: (id: string) => apiClient.delete(ENDPOINTS.adminUser(id)),

  /* ---- Config ---------------------------------------------------------- */

  config: () => one<PlatformConfig>(ENDPOINTS.config, adaptConfig),
  updateConfig: (patch: Record<string, unknown>) =>
    apiClient.patch(ENDPOINTS.updateConfig, patch),

  deleteFeatureFlag: (key: string) => apiClient.delete(ENDPOINTS.featureFlag(key)),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post(ENDPOINTS.changePassword, { currentPassword, newPassword }),

  featureFlags: async (): Promise<FeatureFlag[]> => {
    const res = await apiClient.get<unknown>(ENDPOINTS.featureFlags);
    const data = res.data;
    // The endpoint may return a list of flags or a key/value map; handle both.
    if (Array.isArray(data)) return (data as Raw[]).map((row) => adaptFeatureFlag(row));
    if (data && typeof data === 'object') {
      return Object.entries(data as Record<string, unknown>).map(([key, value]) => (
        typeof value === 'object' && value !== null
          ? adaptFeatureFlag(value as Raw, key)
          : { key, enabled: Boolean(value), description: '' }
      ));
    }
    return [];
  },
  setFeatureFlag: (key: string, enabled: boolean) =>
    apiClient.patch(ENDPOINTS.featureFlag(key), { enabled }),

  /* ---- Uploads --------------------------------------------------------- */

  upload: (file: File) => apiClient.upload(file),
};
