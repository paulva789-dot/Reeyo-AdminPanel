import type { Region } from './geography';

export type Vertical = 'food' | 'grocery' | 'parcel';
/**
 * The order workflow. Defined as OrderStage at the foot of this file (§3.2);
 * this alias is kept because the name is used throughout the console.
 *
 * Lateness is deliberately not a status any more. An order running late is
 * still "in transit" — it is late *and* in transit — and treating late as a
 * status lost the stage the order was actually at. `Order.isLate` carries it.
 */
export type OrderStatus = OrderStage;
/**
 * A delivery zone is a neighbourhood a rider works. The set is defined in
 * geography.ts, which also says which city and region each one sits in, so a
 * record only ever stores the zone and the rest is derived.
 */
export type Zone = string;

export interface Order {
  id: string;            // F-2841 | S-1192 | P-0774
  vertical: Vertical;
  status: OrderStatus;

  /* Parties (§3.4). `customer` and `vendor` stay as plain names for the list
     columns; the full records behind them are `to` and `from`. On a parcel
     these read as Sender and Receiver — see `parcel`. */
  customer: string;
  vendor: string;
  from: Party;           // pickup — the vendor, or the parcel sender
  to: Party;             // drop-off — the customer, or the parcel receiver

  rider: string | null;  // name, for the list column
  riderDetail: OrderRider | null;

  /* Basket and money (§3.3). */
  items: string;         // one-line summary for the list
  basket: BasketLine[];
  packagingFee: number;
  deliveryFee: number;
  discount: { code: string; campaign: string; amount: number } | null;
  commission: number;    // the rule in force, frozen onto the order (§4.3)
  surcharges: { label: string; amount: number }[];
  total: number;         // FCFA — what the customer pays
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  orderNote: string | null;

  /* Where (§3.6). Zone, city and region mirror the drop-off, for scoping. */
  zone: Zone;
  city: string;
  region: Region;
  distanceKm: number;

  /* When (§3.7). */
  placedAt: string;      // ISO 8601
  placedAgo: string;     // "12 min ago", precomputed for the list
  timeline: OrderEvent[];
  eta: string;           // "8 min" | "late 14 min" | "done"
  isLate: boolean;
  /** Minutes from placed to delivered, once complete. */
  fulfilmentMinutes: number | null;

  /** Parcel service only (§3.8). */
  parcel: ParcelDetails | null;

  /** New orders stay pinned to the top of the list until opened (§3.1). */
  acknowledged: boolean;
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

/* ===================================================================== */
/* Functional Specification v1.0 (1 September 2026)                       */
/* ===================================================================== */

/**
 * The spec's nine-stage workflow (§3.2). This replaces the earlier eight-state
 * set: "delayed" was never a stage an order sat in — it is a lateness flag on
 * top of a real stage — and the new set separates "rider assigned" from
 * "picked up", which the old one conflated.
 */
export type OrderStage =
  | 'pending' | 'confirmed' | 'ready for pickup' | 'rider assigned'
  | 'picked up' | 'in transit' | 'delivered' | 'cancelled' | 'failed';

/** The stages an order moves through in order. Terminal states are not here. */
export const ORDER_FLOW: OrderStage[] = [
  'pending', 'confirmed', 'ready for pickup', 'rider assigned',
  'picked up', 'in transit', 'delivered',
];

/** Ending an order requires a reason chosen from a list (§3.2). */
export const CANCEL_REASONS = [
  'Vendor closed', 'Customer cancelled', 'Out of stock',
  'No rider available', 'Address unreachable', 'Duplicate order',
] as const;

export const FAILURE_REASONS = [
  'Customer not reachable', 'Customer refused delivery',
  'Wrong address', 'Package damaged', 'Payment failed on delivery',
] as const;

/** §8.1 — the four methods actually used on the ground. */
export type PaymentMethod = 'Cash on delivery' | 'MoMo' | 'Orange Money' | 'Pay online';
export const PAYMENT_METHOD_LIST: PaymentMethod[] = [
  'Cash on delivery', 'MoMo', 'Orange Money', 'Pay online',
];

/** Tracked separately from order status (§8.1). */
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending confirmation' | 'Refunded';

/** One line of the basket (§3.3). */
export interface BasketLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** Variants, add-ons and extras, each with its own price. */
  options: { label: string; price: number }[];
  /** Customer instructions for this item, e.g. "no onions". */
  note: string | null;
  imageUrl: string | null;
}

/** A party on one end of the delivery (§3.4). */
export interface Party {
  name: string;
  phone: string;
  address: string;
  /** Landmark or access instruction. */
  addressNote: string | null;
  zone: Zone;
  city: string;
  region: Region;
  /** Decimal degrees, for the map pin and the distance calculation. */
  lat: number;
  lng: number;
}

/** One entry in the order's timeline (§3.7). */
export interface OrderEvent {
  stage: OrderStage;
  /** ISO 8601. Rendered relative or absolute depending on the surface. */
  at: string;
  /** Who moved it — an admin name, or the actor's role. */
  by: string;
  reason: string | null;
  note: string | null;
}

/** The rider attached to an order, registered or ad-hoc (§3.5). */
export interface OrderRider {
  id: string | null;
  name: string;
  phone: string;
  vehicle: string;
  plate: string | null;
  team: string | null;
  zone: Zone | null;
  photoUrl: string | null;
  /** What the rider earns on this order. */
  earnings: number;
}

/** Parcel-only cargo details (§3.8). */
export interface ParcelDetails {
  description: string;
  declaredValue: number;
  sizeBand: 'Small' | 'Medium' | 'Large';
  weightKg: number | null;
  fragile: boolean;
  /** The person actually collecting, where that differs from the receiver. */
  recipientName: string | null;
  recipientPhone: string | null;
  /** Proof of delivery, captured at handover. */
  signedBy: string | null;
  proofPhotoUrl: string | null;
}

/* ---- Vendor management, specification section 4 ---------------------- */

/** One open/close window. A day can have several, for a lunch break. */
export interface HourSlot {
  opens: string;   // "08:00"
  closes: string;  // "14:30"
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface DayHours {
  day: Weekday;
  closed: boolean;
  slots: HourSlot[];
}

/** A one-off closure that overrides the weekly pattern (section 4.2). */
export interface SpecialDate {
  date: string;      // yyyy-mm-dd
  closed: boolean;
  note: string;
}

/**
 * Commission is either a percentage of the subtotal or a flat amount per
 * order — never both at once, which is why this is a discriminated union
 * rather than two nullable fields that could disagree.
 */
export type CommissionRule =
  | { kind: 'percentage'; value: number }
  | { kind: 'flat'; value: number };

export type WalletSource = 'order' | 'manual adjustment' | 'settlement';

export interface WalletEntry {
  id: string;
  at: string;              // ISO 8601
  /** Positive credits, negative debits. */
  amount: number;
  balanceAfter: number;
  source: WalletSource;
  reason: string;
  reference: string | null;
  note: string | null;
  /** Who performed it. Nothing here can be edited or deleted, only reversed. */
  by: string;
  /** Set on the entry that reverses another. */
  reverses: string | null;
}

/** The full vendor record of section 4.1. */
export interface VendorProfile {
  id: string;
  businessName: string;
  adminName: string;
  adminNumber: string;
  shortAddress: string;
  mapsAddress: string;
  lat: number;
  lng: number;
  zone: Zone;
  city: string;
  region: Region;
  category: string;
  service: Vertical;
  imageUrl: string | null;
  packagingFee: number | null;
  hours: DayHours[];
  specialDates: SpecialDate[];
  paymentName: string;
  paymentNumber: string;
  commission: CommissionRule;
  walletBalance: number;
  wallet: WalletEntry[];
  joined: string;          // yyyy-mm-dd
  status: 'active' | 'paused' | 'suspended';
}
