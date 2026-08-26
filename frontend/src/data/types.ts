import type { Region } from './geography';

export type Vertical = 'food' | 'grocery' | 'parcel';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready'
                        | 'on the way' | 'delivered' | 'cancelled' | 'delayed';
/**
 * A delivery zone is a neighbourhood a rider works. The set is defined in
 * geography.ts, which also says which city and region each one sits in, so a
 * record only ever stores the zone and the rest is derived.
 */
export type Zone = string;

export interface Order {
  id: string;            // F-2841 | S-1192 | P-0774
  vertical: Vertical;
  customer: string;
  vendor: string;
  rider: string | null;
  items: string;
  total: number;         // FCFA
  status: OrderStatus;
  zone: Zone;
  city: string;
  region: Region;
  placedAgo: string;     // "12 min ago"
  eta: string;           // "8 min" | "late 14 min" | "done"
  payment: string;       // "MTN MoMo" | "Orange Money" | "Cash" | "Card"
}

export interface Vendor {
  id: string; name: string; vertical: Vertical; category: string;
  zone: Zone; city: string; region: Region;
  orders: number; revenue: number; rating: number;
  prepMinutes: number; status: 'active' | 'suspended' | 'review'; joined: string;
}

export interface Rider {
  id: string; name: string; zone: Zone; city: string; region: Region;
  vehicle: 'Moto' | 'Bicycle' | 'Car';
  trips: number; rating: number; owed: number;
  state: 'on a delivery' | 'idle' | 'running late'; phone: string;
}

export interface Customer {
  id: string; name: string; zone: Zone; city: string; region: Region;
  orders: number; spend: number;
  lastOrder: string; rating: number;
  segment: 'new' | 'active' | 'loyal' | 'lapsed';
}

export interface Payment {
  id: string; date: string; amount: number; from: string; to: string;
  method: string; reason: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface PayoutRequest {
  id: string; who: string; kind: 'Rider' | 'Vendor'; amount: number;
  date: string; method: string; number: string;
  status: 'pending' | 'approved' | 'failed';
}

export interface Offer {
  id: number; name: string; code: string; vertical: string; zone: string;
  type: 'Percent off' | 'Amount off' | 'Free delivery' | 'Flat delivery fee';
  value: string; payer: 'Platform' | 'Vendor' | 'Split 50/50';
  uses: number; spent: number; active: boolean; ends: string;
}

export interface Banner {
  id: number; name: string; vertical: string; zone: string;
  destination: string; active: boolean; taps: number;
}

/* Beyond section 7 — needed by the pages in sections 8.4, 8.8 and 8.10. */

export interface MenuItem {
  id: string; name: string; price: number;
  wasPrice: number | null;          // struck through when present
  stock: number; addOns: number; available: boolean;
}

export interface MenuCategory {
  id: string; name: string; visible: boolean;
  opens: string; closes: string;
  days: string[];                   // 'Mon' ... 'Sun'
  items: MenuItem[];
}

export interface Announcement {
  id: number; headline: string; message: string;
  audience: string; channel: string;
  sent: string; reach: number; openRate: number;
}

export interface SpinPrize {
  id: number; name: string; weight: number; colourToken: string;
}

export interface Team {
  id: string; name: string; lead: string; size: number;
  zone: Zone; city: string; region: Region; shift: string; load: number;
}

export interface FeeRule {
  id: string; name: string; baseFare: number; perKm: number;
  condition: string; active: boolean;
}

export interface RiderPosition {
  riderId: string; x: number; y: number;   // percentage across the map panel
}

/* Capabilities the backend serves that the first eleven pages did not cover. */

export type DisputeStatus = 'open' | 'resolved' | 'rejected';
export type DisputePriority = 'low' | 'normal' | 'high';

export interface DisputeMessage {
  id: string; author: string; body: string; sentAt: string;
}

export interface Dispute {
  id: string;
  ticket: string;             // customer-facing ticket number
  subject: string;
  category: string;
  status: DisputeStatus;
  priority: DisputePriority;
  customer: string;
  orderId: string | null;
  openedAgo: string;
  resolution: string | null;
  messages: DisputeMessage[];
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ChangeType = 'price update' | 'new item';

export interface MenuApproval {
  id: string;
  vendor: string;
  itemName: string;
  category: string;
  changeType: ChangeType;
  currentPrice: number | null;   // null for a brand new item
  requestedPrice: number;
  status: ApprovalStatus;
  submittedAgo: string;
  reason: string;
  adminNotes: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;             // the only part of the key ever shown again
  scopes: string[];
  lastUsed: string | null;
  revoked: boolean;
}

/* ------------------------------------------------------------------------ */
/* Everything below is backed by a real admin-api route. See                  */
/* docs/ADMIN-API-ENDPOINT-REFERENCE.md — nothing here is speculative.        */
/* ------------------------------------------------------------------------ */

/** Approval queues — vendors and riders waiting on a decision. */
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface PendingVendor {
  id: string;
  name: string;
  category: string;
  zone: Zone;
  city: string;
  region: Region;
  owner: string;
  phone: string;
  email: string;
  submittedAgo: string;
  status: ApprovalDecision;
  commissionRate: number | null;
  featured: boolean;
}

/** The five document types /riders/:id/verify-documents accepts. */
export const RIDER_DOCUMENT_TYPES = [
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'VEHICLE_REGISTRATION',
  'PROFILE_PHOTO',
  'INSURANCE',
] as const;

export type RiderDocumentType = (typeof RIDER_DOCUMENT_TYPES)[number];
export type DocumentDecision = 'pending' | 'approved' | 'rejected';

export interface RiderDocument {
  type: RiderDocumentType;
  status: DocumentDecision;
  url: string | null;
  reason: string | null;
}

export interface PendingRider {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  zone: Zone;
  city: string;
  region: Region;
  submittedAgo: string;
  status: ApprovalDecision;
  documents: RiderDocument[];
}

/** Analytics — one shape per endpoint. */
export interface PlatformStats {
  orders: number;
  revenue: number;
  customers: number;
  vendors: number;
  riders: number;
  averageBasket: number;
  cancelRate: number;
}

export interface RevenuePoint {
  label: string;
  value: number;
}

export interface RankedEntity {
  id: string;
  name: string;
  value: number;
  orders: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface LiveSnapshot {
  activeOrders: number;
  onlineRiders: number;
  onlineVendors: number;
  ordersToday: number;
  revenueToday: number;
  pendingApprovals: number;
}

/**
 * A rider's position from /riders/live-locations.
 *
 * Field names are the ones the previous admin panel read off this endpoint in
 * production, so unlike most of this file they are known rather than guessed:
 * rider_id, name, lat, lng, current_order_id.
 */
export interface RiderLocation {
  riderId: string;
  name: string;
  lat: number;
  lng: number;
  /** The order they are carrying, or null when they are free. */
  currentOrderId: string | null;
}

/** Logistics — a delivery zone as the API stores it. */
export interface DeliveryZone {
  id: string;
  name: string;
  countryCode: string;
  polygon: [number, number][];      // [lat, lng], at least three points
  deliveryFeeOverride: number | null;
  isActive: boolean;
}

/** Engagement. */
export interface EngagementBanner {
  id: string;
  title: string;
  imageUrl: string | null;
  destination: string;
  isActive: boolean;
  taps: number;
}

export interface Popup {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

/** The fuller breakdown behind a popup, from /engagement/popups/:id/stats. */
export interface PopupStats {
  impressions: number;
  clicks: number;
  dismissals: number;
  uniqueViewers: number;
}

export interface SpinWheelSegment {
  id: string;
  label: string;
  weight: number;
  rewardType: string;
}

export interface SpinWheel {
  id: string;
  name: string;
  isActive: boolean;
  segments: SpinWheelSegment[];
}

export interface LoyaltyRule {
  id: string;
  name: string;
  pointsPerOrder: number;
  isActive: boolean;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  imageUrl: string | null;
  isActive: boolean;
}

/** One spin recorded by /engagement/spin-wheels/:id/results. */
export interface SpinResult {
  id: string;
  user: string;
  prize: string;
  wonAt: string;
}

/** A customer's loyalty balance, from /engagement/loyalty/accounts/:userId. */
export interface LoyaltyAccount {
  userId: string;
  points: number;
  tier: string | null;
}

/** One movement on that balance, from the account's /ledger. */
export interface LoyaltyEntry {
  id: string;
  points: number;          // signed: earned is positive, redeemed negative
  reason: string;
  at: string;
}

export interface PreferenceTag {
  tag: string;
  usageCount: number;
}

export interface TrackingFact {
  id: string;
  text: string;
  isActive: boolean;
}

export interface SharedCart {
  id: string;
  owner: string;
  participants: number;
  total: number;
  createdAgo: string;
}

/** Admin users — managing other admins. */
export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';
export type AdminStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: string | null;
}

/** Platform config and feature flags. */
export interface PlatformConfig {
  commissionRate: number | null;
  serviceFee: number | null;
  riderCut: number | null;
  baseDeliveryFare: number | null;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
}

/** An order's real journey, from /orders/:id/timeline. */
export interface TimelineEvent {
  id: string;
  status: string;
  at: string;
  note: string | null;
}
