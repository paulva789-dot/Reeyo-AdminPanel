// Adapters for the platform-administration half of admin-api: approval queues,
// analytics, logistics, engagement, admin users and config.
//
// Same rule as adapters.ts — every field is read through plausible names with a
// defined fallback, because no authenticated response body has been seen yet.
// Collapse each list to the real key once a payload is available.

import {
  pick, str, num, normaliseEnum, nested, toPlacement, toRelative,
} from './adapters';
import type { Raw } from './adapters';
import { RIDER_DOCUMENT_TYPES } from '../data/types';
import type {
  ApprovalDecision, PendingVendor, PendingRider, RiderDocument, DocumentDecision,
  PlatformStats, RevenuePoint, RankedEntity, OrderStatusCount, LiveSnapshot,
  DeliveryZone, RiderLocation, EngagementBanner, Popup, SpinWheel, SpinWheelSegment,
  LoyaltyRule, LoyaltyReward, PreferenceTag, TrackingFact, SharedCart,
  SpinResult, LoyaltyAccount, LoyaltyEntry, PopupStats,
  AdminUser, PlatformConfig, FeatureFlag, TimelineEvent,
} from '../data/types';

const APPROVAL_DECISIONS = ['pending', 'approved', 'rejected', 'suspended'] as const;

function toDecision(value: unknown): ApprovalDecision {
  const raw = normaliseEnum(String(value ?? 'pending'));
  if ((APPROVAL_DECISIONS as readonly string[]).includes(raw)) return raw as ApprovalDecision;
  if (raw.includes('approv') || raw === 'active') return 'approved';
  if (raw.includes('reject') || raw.includes('declin')) return 'rejected';
  if (raw.includes('suspend')) return 'suspended';
  return 'pending';
}

function flag(row: Raw, keys: string[], fallback = true): boolean {
  const v = pick(row, keys);
  return v === undefined ? fallback : Boolean(v);
}

/* ---- Approval queues --------------------------------------------------- */

export function adaptPendingVendor(row: Raw): PendingVendor {
  const name = str(row, ['business_name', 'businessName', 'name'], 'Unknown');
  const commission = pick(row, ['commission_rate', 'commissionRate']);
  return {
    id: str(row, ['id', '_id', 'vendor_id'], name),
    name,
    category: str(row, ['category', 'cuisine', 'vendor_type'], '—'),
    ...toPlacement(row),
    owner: str(row, ['owner_name', 'ownerName', 'owner'], '—'),
    phone: str(row, ['phone', 'phone_number'], '—'),
    email: str(row, ['email'], '—'),
    submittedAgo: toRelative(pick(row, ['created_at', 'createdAt', 'submitted_at'])),
    status: toDecision(pick(row, ['status', 'state', 'approval_status'])),
    commissionRate: commission === undefined ? null : Number(commission),
    featured: Boolean(pick(row, ['featured', 'is_featured'])),
  };
}

function adaptRiderDocuments(row: Raw): RiderDocument[] {
  const raw = pick(row, ['documents', 'kyc_documents', 'kycDocuments']);
  const byType = new Map<string, Raw>();
  if (Array.isArray(raw)) {
    for (const d of raw as Raw[]) {
      const key = normaliseEnum(str(d, ['document_type', 'documentType', 'type']))
        .replace(/ /g, '_')
        .toUpperCase();
      byType.set(key, d);
    }
  }

  // Always return all five. A document the API omits then reads as "not
  // submitted" rather than vanishing from the review, which would let an admin
  // approve a rider without noticing a missing licence.
  return RIDER_DOCUMENT_TYPES.map((type) => {
    const d = byType.get(type);
    const rawStatus = d ? normaliseEnum(str(d, ['status', 'state'], 'pending')) : 'pending';
    const status: DocumentDecision = rawStatus.includes('approv') ? 'approved'
      : rawStatus.includes('reject') ? 'rejected' : 'pending';
    return {
      type,
      status,
      url: d ? (str(d, ['url', 'file_url', 'image_url']) || null) : null,
      reason: d ? (str(d, ['reason', 'note']) || null) : null,
    };
  });
}

export function adaptPendingRider(row: Raw): PendingRider {
  const name = [str(row, ['first_name', 'firstName']), str(row, ['last_name', 'lastName'])]
    .filter(Boolean).join(' ') || str(row, ['name', 'full_name'], 'Unknown');
  return {
    id: str(row, ['id', '_id', 'rider_id'], name),
    name,
    phone: str(row, ['phone', 'phone_number'], '—'),
    email: str(row, ['email'], '—'),
    vehicle: str(row, ['vehicle_type', 'vehicleType', 'vehicle'], '—'),
    plate: str(row, ['vehicle_plate', 'vehiclePlate', 'plate'], '—'),
    ...toPlacement(row),
    submittedAgo: toRelative(pick(row, ['created_at', 'createdAt', 'submitted_at'])),
    status: toDecision(pick(row, ['status', 'state', 'approval_status'])),
    documents: adaptRiderDocuments(row),
  };
}

/* ---- Analytics --------------------------------------------------------- */

export function adaptPlatformStats(payload: unknown): PlatformStats {
  const row = (payload ?? {}) as Raw;
  return {
    orders: num(row, ['orders', 'total_orders', 'totalOrders', 'order_count']),
    revenue: num(row, ['revenue', 'total_revenue', 'totalRevenue', 'gmv']),
    customers: num(row, ['customers', 'users', 'total_users', 'totalUsers']),
    vendors: num(row, ['vendors', 'total_vendors', 'totalVendors']),
    riders: num(row, ['riders', 'total_riders', 'totalRiders']),
    averageBasket: num(row, ['average_basket', 'averageBasket', 'avg_order_value']),
    cancelRate: num(row, ['cancel_rate', 'cancelRate', 'cancellation_rate']),
  };
}

export function adaptRevenuePoint(row: Raw): RevenuePoint {
  return {
    label: String(pick(row, ['date', 'label', 'day', 'period']) ?? '—').slice(0, 10),
    value: num(row, ['revenue', 'value', 'total', 'amount']),
  };
}

export function adaptRanked(row: Raw): RankedEntity {
  const name = str(row, ['name', 'business_name', 'full_name'], 'Unknown');
  return {
    id: str(row, ['id', '_id'], name),
    name,
    value: num(row, ['revenue', 'value', 'total', 'earnings', 'amount']),
    orders: num(row, ['orders', 'order_count', 'deliveries', 'trips']),
  };
}

export function adaptOrderStatusCount(row: Raw): OrderStatusCount {
  return {
    status: normaliseEnum(str(row, ['status', 'state'], 'unknown')),
    count: num(row, ['count', 'total', 'value']),
  };
}

export function adaptLiveSnapshot(payload: unknown): LiveSnapshot {
  const row = (payload ?? {}) as Raw;
  return {
    activeOrders: num(row, ['active_orders', 'activeOrders']),
    onlineRiders: num(row, ['online_riders', 'onlineRiders']),
    onlineVendors: num(row, ['online_vendors', 'onlineVendors']),
    ordersToday: num(row, ['orders_today', 'ordersToday', 'today_orders']),
    revenueToday: num(row, ['revenue_today', 'revenueToday', 'today_revenue']),
    pendingApprovals: num(row, ['pending_approvals', 'pendingApprovals']),
  };
}

/* ---- Logistics --------------------------------------------------------- */

export function adaptRiderLocation(row: Raw): RiderLocation {
  const order = pick(row, ['current_order_id', 'currentOrderId', 'order_id']);
  return {
    riderId: str(row, ['rider_id', 'riderId', 'id', '_id'], '—'),
    name: str(row, ['name', 'full_name', 'rider_name'], 'Unknown rider'),
    lat: num(row, ['lat', 'latitude']),
    lng: num(row, ['lng', 'lon', 'longitude']),
    currentOrderId: order === undefined || order === null ? null : String(order),
  };
}

export function adaptZone(row: Raw): DeliveryZone {
  const raw = pick(row, ['polygon', 'coordinates', 'boundary']);
  const polygon: [number, number][] = Array.isArray(raw)
    ? (raw as unknown[])
      .map((p) => (Array.isArray(p)
        ? [Number(p[0]), Number(p[1])] as [number, number]
        : null))
      .filter((p): p is [number, number] => p !== null && p.every(Number.isFinite))
    : [];
  const fee = pick(row, ['delivery_fee_override', 'deliveryFeeOverride', 'delivery_fee']);
  return {
    id: str(row, ['id', '_id', 'zone_id'], '—'),
    name: str(row, ['name'], '—'),
    countryCode: str(row, ['country_code', 'countryCode'], 'CM'),
    polygon,
    deliveryFeeOverride: fee === undefined ? null : Number(fee),
    isActive: flag(row, ['is_active', 'isActive']),
  };
}

/* ---- Engagement -------------------------------------------------------- */

export function adaptBanner(row: Raw): EngagementBanner {
  return {
    id: str(row, ['id', '_id'], '—'),
    title: str(row, ['title', 'name', 'headline'], '—'),
    imageUrl: str(row, ['image_url', 'imageUrl', 'url']) || null,
    destination: str(row, ['destination', 'deep_link', 'target'], '—'),
    isActive: flag(row, ['is_active', 'isActive', 'active']),
    taps: num(row, ['taps', 'clicks', 'tap_count']),
  };
}

export function adaptPopup(row: Raw): Popup {
  return {
    id: str(row, ['id', '_id'], '—'),
    title: str(row, ['title', 'headline'], '—'),
    body: str(row, ['body', 'message', 'text'], '—'),
    imageUrl: str(row, ['image_url', 'imageUrl']) || null,
    isActive: flag(row, ['is_active', 'isActive', 'active']),
    impressions: num(row, ['impressions', 'views']),
    clicks: num(row, ['clicks', 'taps']),
  };
}

export function adaptSpinWheel(row: Raw): SpinWheel {
  const rawSegments = pick(row, ['segments', 'prizes']);
  const segments: SpinWheelSegment[] = Array.isArray(rawSegments)
    ? (rawSegments as Raw[]).map((sgm, i) => ({
      id: str(sgm, ['id', '_id'], `seg-${i + 1}`),
      label: str(sgm, ['label', 'name', 'title'], '—'),
      weight: num(sgm, ['weight', 'probability', 'chance']),
      rewardType: str(sgm, ['reward_type', 'rewardType', 'type'], '—'),
    }))
    : [];
  return {
    id: str(row, ['id', '_id'], '—'),
    name: str(row, ['name', 'title'], '—'),
    isActive: flag(row, ['is_active', 'isActive', 'active']),
    segments,
  };
}

export function adaptLoyaltyRule(row: Raw): LoyaltyRule {
  return {
    id: str(row, ['id', '_id'], '—'),
    name: str(row, ['name', 'title'], '—'),
    pointsPerOrder: num(row, ['points_per_order', 'pointsPerOrder', 'points']),
    isActive: flag(row, ['is_active', 'isActive', 'active']),
  };
}

export function adaptLoyaltyReward(row: Raw): LoyaltyReward {
  return {
    id: str(row, ['id', '_id'], '—'),
    name: str(row, ['name', 'title'], '—'),
    pointsCost: num(row, ['points_cost', 'pointsCost', 'cost', 'points']),
    imageUrl: str(row, ['image_url', 'imageUrl']) || null,
    isActive: flag(row, ['is_active', 'isActive', 'active']),
  };
}

export function adaptPopupStats(payload: unknown): PopupStats {
  const row = (payload ?? {}) as Raw;
  return {
    impressions: num(row, ['impressions', 'views', 'shown', 'total_impressions']),
    clicks: num(row, ['clicks', 'taps', 'total_clicks']),
    dismissals: num(row, ['dismissals', 'dismissed', 'closes']),
    uniqueViewers: num(row, ['unique_viewers', 'uniqueViewers', 'unique_users']),
  };
}

export function adaptSpinResult(row: Raw): SpinResult {
  return {
    id: str(row, ['id', '_id'], '—'),
    user: str(row, ['user_name', 'userName', 'user', 'user_id'], 'Unknown'),
    prize: str(row, ['prize', 'label', 'segment_label', 'reward'], '—'),
    wonAt: toRelative(pick(row, ['created_at', 'createdAt', 'won_at', 'spun_at'])),
  };
}

export function adaptLoyaltyAccount(payload: unknown): LoyaltyAccount {
  const row = (payload ?? {}) as Raw;
  const tier = pick(row, ['tier', 'level']);
  return {
    userId: str(row, ['user_id', 'userId', 'id'], '—'),
    points: num(row, ['points', 'balance', 'points_balance']),
    tier: tier === undefined || tier === null ? null : String(tier),
  };
}

export function adaptLoyaltyEntry(row: Raw): LoyaltyEntry {
  return {
    id: str(row, ['id', '_id'], '—'),
    points: num(row, ['points', 'amount', 'delta']),
    reason: str(row, ['reason', 'description', 'type'], '—'),
    at: toRelative(pick(row, ['created_at', 'createdAt', 'at'])),
  };
}

export function adaptPreferenceTag(row: Raw): PreferenceTag {
  return {
    tag: str(row, ['tag', 'name', 'label'], '—'),
    usageCount: num(row, ['usage_count', 'usageCount', 'count', 'users']),
  };
}

export function adaptTrackingFact(row: Raw): TrackingFact {
  return {
    id: str(row, ['id', '_id'], '—'),
    text: str(row, ['text', 'fact', 'message', 'body'], '—'),
    isActive: flag(row, ['is_active', 'isActive', 'active']),
  };
}

export function adaptSharedCart(row: Raw): SharedCart {
  return {
    id: str(row, ['id', '_id'], '—'),
    owner: nested(row, ['owner', 'user'], ['name', 'full_name'])
      || str(row, ['owner_name'], '—'),
    participants: num(row, ['participants', 'members', 'participant_count']),
    total: num(row, ['total', 'total_amount', 'amount']),
    createdAgo: toRelative(pick(row, ['created_at', 'createdAt'])),
  };
}

/* ---- Admins and config ------------------------------------------------- */

export function adaptAdminUser(row: Raw): AdminUser {
  const rawRole = normaliseEnum(str(row, ['role'], 'admin')).replace(/ /g, '_').toUpperCase();
  const rawStatus = normaliseEnum(str(row, ['status', 'state'], 'active')).toUpperCase();
  return {
    id: str(row, ['id', '_id', 'admin_id'], '—'),
    name: str(row, ['name', 'full_name'], '—'),
    email: str(row, ['email'], '—'),
    role: rawRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
    status: rawStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    lastLogin: String(pick(row, ['last_login_at', 'lastLoginAt']) ?? '').slice(0, 10) || null,
  };
}

export function adaptConfig(payload: unknown): PlatformConfig {
  const row = (payload ?? {}) as Raw;
  const get = (keys: string[]) => {
    const v = pick(row, keys);
    return v === undefined ? null : Number(v);
  };
  return {
    commissionRate: get(['commission_rate', 'commissionRate']),
    serviceFee: get(['service_fee', 'serviceFee']),
    riderCut: get(['rider_cut', 'riderCut', 'rider_commission']),
    baseDeliveryFare: get(['base_delivery_fare', 'baseDeliveryFare', 'base_fare']),
  };
}

export function adaptFeatureFlag(row: Raw, key?: string): FeatureFlag {
  return {
    key: key ?? str(row, ['key', 'name', 'flag'], '—'),
    enabled: Boolean(pick(row, ['enabled', 'is_enabled', 'value', 'active'])),
    description: str(row, ['description', 'note'], ''),
  };
}

export function adaptTimelineEvent(row: Raw, index: number): TimelineEvent {
  return {
    id: str(row, ['id', '_id'], `event-${index + 1}`),
    status: normaliseEnum(str(row, ['status', 'state', 'event'], 'unknown')),
    at: toRelative(pick(row, ['created_at', 'createdAt', 'at', 'timestamp'])),
    note: str(row, ['note', 'description', 'message']) || null,
  };
}
