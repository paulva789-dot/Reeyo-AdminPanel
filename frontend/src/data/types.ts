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
