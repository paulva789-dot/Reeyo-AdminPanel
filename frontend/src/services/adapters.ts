// Maps admin-api payloads onto the console's own types.
//
// The authenticated response shapes could not be inspected from here (every
// route returns 401 without a session), so each field is read through a list of
// plausible names rather than one guessed spelling, and every value has a
// defined fallback. The console's types stay canonical; drift lives here.
//
// When the real shapes are confirmed, collapse each pick() list to the one true
// key — that is a change to this file only, not to any page.

import type {
  Order, OrderStatus, Vertical, Zone, Vendor, Rider, Customer,
  Payment, PayoutRequest,
} from '../data/types';

type Raw = Record<string, unknown>;

function pick(row: Raw, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function str(row: Raw, keys: string[], fallback = ''): string {
  const v = pick(row, keys);
  return v === undefined ? fallback : String(v);
}

function num(row: Raw, keys: string[], fallback = 0): number {
  const v = pick(row, keys);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** The API may use SCREAMING_SNAKE for enums; the console uses lowercase words. */
function normaliseEnum(value: string): string {
  return value.replace(/_/g, ' ').trim().toLowerCase();
}

const ORDER_STATUSES: OrderStatus[] = [
  'new', 'accepted', 'preparing', 'ready', 'on the way', 'delivered',
  'cancelled', 'delayed',
];

const STATUS_ALIASES: Record<string, OrderStatus> = {
  pending: 'new',
  placed: 'new',
  confirmed: 'accepted',
  in_transit: 'on the way',
  'in transit': 'on the way',
  dispatched: 'on the way',
  'out for delivery': 'on the way',
  completed: 'delivered',
  canceled: 'cancelled',
  late: 'delayed',
};

export function toOrderStatus(value: unknown): OrderStatus {
  const raw = normaliseEnum(String(value ?? ''));
  if ((ORDER_STATUSES as string[]).includes(raw)) return raw as OrderStatus;
  return STATUS_ALIASES[raw] ?? 'new';
}

const VERTICALS: Vertical[] = ['food', 'grocery', 'parcel'];

export function toVertical(value: unknown, orderId = ''): Vertical {
  const raw = normaliseEnum(String(value ?? ''));
  if ((VERTICALS as string[]).includes(raw)) return raw as Vertical;
  if (raw.includes('food') || raw.includes('restaurant')) return 'food';
  if (raw.includes('groc') || raw.includes('store') || raw.includes('shop')) return 'grocery';
  if (raw.includes('parcel') || raw.includes('courier') || raw.includes('deliver')) return 'parcel';
  // Fall back to the ID prefix convention: F- food, S- grocery, P- parcel.
  const prefix = orderId.charAt(0).toUpperCase();
  if (prefix === 'F') return 'food';
  if (prefix === 'S') return 'grocery';
  if (prefix === 'P') return 'parcel';
  return 'food';
}

const ZONES: Zone[] = ['Molyko', 'Bonduma', 'Great Soppo', 'Mile 16', 'Muea'];

export function toZone(value: unknown): Zone {
  const raw = String(value ?? '').trim().toLowerCase();
  const match = ZONES.find((z) => z.toLowerCase() === raw);
  return match ?? 'Molyko';
}

/** "2026-08-22T09:14:00Z" -> "12 min ago". Empty input yields an em dash. */
export function toRelative(value: unknown): string {
  if (!value) return '—';
  const then = new Date(String(value)).getTime();
  if (Number.isNaN(then)) return '—';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Turns an ETA timestamp or minute count into the console's ETA string. */
export function toEta(value: unknown, status: OrderStatus): string {
  if (status === 'delivered' || status === 'cancelled') return 'done';
  if (value === undefined || value === null || value === '') return '—';

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    return asNumber < 0 ? `late ${Math.abs(Math.round(asNumber))} min` : `${Math.round(asNumber)} min`;
  }

  const target = new Date(String(value)).getTime();
  if (Number.isNaN(target)) return '—';
  const mins = Math.round((target - Date.now()) / 60000);
  return mins < 0 ? `late ${Math.abs(mins)} min` : `${mins} min`;
}

function nested(row: Raw, keys: string[], inner: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value && typeof value === 'object') {
      const found = str(value as Raw, inner);
      if (found) return found;
    }
  }
  return '';
}

export function adaptOrder(row: Raw): Order {
  const id = str(row, ['order_number', 'orderNumber', 'reference', 'id', '_id'], '—');
  const status = toOrderStatus(pick(row, ['status', 'state', 'order_status']));

  const customer = nested(row, ['customer', 'user', 'client'], ['name', 'full_name', 'fullName'])
    || str(row, ['customer_name', 'customerName'], 'Unknown');
  const vendor = nested(row, ['vendor', 'store', 'restaurant', 'merchant'], ['name', 'business_name'])
    || str(row, ['vendor_name', 'vendorName'], 'Unknown');
  const riderName = nested(row, ['rider', 'driver', 'courier'], ['name', 'full_name'])
    || str(row, ['rider_name', 'riderName'], '');

  return {
    id,
    vertical: toVertical(pick(row, ['vertical', 'service', 'service_type', 'type', 'category']), id),
    customer,
    vendor,
    rider: riderName || null,
    items: str(row, ['items_summary', 'itemsSummary', 'summary', 'description'], '—'),
    total: num(row, ['total', 'total_amount', 'totalAmount', 'amount', 'grand_total']),
    status,
    zone: toZone(pick(row, ['zone', 'delivery_zone', 'area'])),
    placedAgo: toRelative(pick(row, ['created_at', 'createdAt', 'placed_at', 'placedAt'])),
    eta: toEta(pick(row, ['eta', 'eta_minutes', 'etaMinutes', 'estimated_delivery_at']), status),
    payment: str(row, ['payment_method', 'paymentMethod', 'payment'], '—'),
  };
}

const VENDOR_STATUSES = ['active', 'suspended', 'review'] as const;

export function adaptVendor(row: Raw): Vendor {
  const rawStatus = normaliseEnum(str(row, ['status', 'state'], 'active'));
  const status = (VENDOR_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus as Vendor['status']
    : rawStatus.includes('suspend') ? 'suspended'
      : rawStatus.includes('review') || rawStatus.includes('pending') ? 'review'
        : 'active';

  const name = str(row, ['name', 'business_name', 'businessName'], 'Unknown');
  return {
    id: str(row, ['id', '_id', 'vendor_id'], name),
    name,
    vertical: toVertical(pick(row, ['vertical', 'service', 'type', 'category'])),
    category: str(row, ['category', 'cuisine', 'vendor_type'], '—'),
    zone: toZone(pick(row, ['zone', 'area'])),
    orders: num(row, ['orders', 'order_count', 'total_orders', 'ordersCount']),
    revenue: num(row, ['revenue', 'total_revenue', 'gross', 'totalRevenue']),
    rating: num(row, ['rating', 'average_rating', 'avgRating']),
    prepMinutes: num(row, ['prep_minutes', 'prepMinutes', 'avg_prep_time', 'preparation_time']),
    status,
    joined: String(pick(row, ['created_at', 'createdAt', 'joined', 'joined_at']) ?? '—').slice(0, 10),
  };
}

const RIDER_STATES = ['on a delivery', 'idle', 'running late'] as const;

export function adaptRider(row: Raw): Rider {
  const rawState = normaliseEnum(str(row, ['state', 'status', 'availability'], 'idle'));
  const state = (RIDER_STATES as readonly string[]).includes(rawState)
    ? rawState as Rider['state']
    : rawState.includes('late') ? 'running late'
      : rawState.includes('deliver') || rawState.includes('busy') || rawState.includes('online')
        ? 'on a delivery'
        : 'idle';

  const rawVehicle = normaliseEnum(str(row, ['vehicle', 'vehicle_type', 'vehicleType'], 'moto'));
  const vehicle: Rider['vehicle'] = rawVehicle.includes('car') ? 'Car'
    : rawVehicle.includes('bicy') || rawVehicle.includes('bike') ? 'Bicycle'
      : 'Moto';

  const name = str(row, ['name', 'full_name', 'fullName'], 'Unknown');
  return {
    id: str(row, ['id', '_id', 'rider_id'], name),
    name,
    zone: toZone(pick(row, ['zone', 'area'])),
    vehicle,
    trips: num(row, ['trips', 'total_deliveries', 'totalDeliveries', 'deliveries']),
    rating: num(row, ['rating', 'average_rating', 'avgRating']),
    owed: num(row, ['owed', 'balance', 'pending_earnings', 'unpaid_earnings']),
    state,
    phone: str(row, ['phone', 'phone_number', 'phoneNumber'], '—'),
  };
}

const SEGMENTS = ['new', 'active', 'loyal', 'lapsed'] as const;

export function adaptCustomer(row: Raw): Customer {
  const orders = num(row, ['orders', 'order_count', 'total_orders']);
  const rawSegment = normaliseEnum(str(row, ['segment', 'tier'], ''));
  // Derive a segment when the API does not carry one.
  const segment: Customer['segment'] = (SEGMENTS as readonly string[]).includes(rawSegment)
    ? rawSegment as Customer['segment']
    : orders === 0 ? 'new'
      : orders >= 40 ? 'loyal'
        : orders >= 5 ? 'active'
          : 'new';

  const name = str(row, ['name', 'full_name', 'fullName'], 'Unknown');
  return {
    id: str(row, ['id', '_id', 'user_id'], name),
    name,
    zone: toZone(pick(row, ['zone', 'area'])),
    orders,
    spend: num(row, ['spend', 'lifetime_spend', 'total_spent', 'totalSpent']),
    lastOrder: String(pick(row, ['last_order_at', 'lastOrderAt', 'last_order']) ?? '—').slice(0, 10),
    rating: num(row, ['rating', 'average_rating']),
    segment,
  };
}

const PAYMENT_STATUSES = ['completed', 'pending', 'failed'] as const;

export function adaptPayment(row: Raw): Payment {
  const rawStatus = normaliseEnum(str(row, ['status', 'state'], 'pending'));
  const status = (PAYMENT_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus as Payment['status']
    : rawStatus.includes('succe') || rawStatus.includes('paid') ? 'completed'
      : rawStatus.includes('fail') || rawStatus.includes('declin') ? 'failed'
        : 'pending';

  return {
    id: str(row, ['reference', 'id', '_id', 'transaction_id'], '—'),
    date: String(pick(row, ['created_at', 'createdAt', 'date']) ?? '—').slice(0, 10),
    amount: num(row, ['amount', 'total']),
    from: str(row, ['from', 'payer', 'source'], '—'),
    to: str(row, ['to', 'payee', 'destination'], '—'),
    method: str(row, ['method', 'payment_method', 'channel'], '—'),
    reason: str(row, ['reason', 'description', 'narration'], '—'),
    status,
  };
}

const REQUEST_STATUSES = ['pending', 'approved', 'failed'] as const;

export function adaptPayoutRequest(row: Raw): PayoutRequest {
  const rawStatus = normaliseEnum(str(row, ['status', 'state'], 'pending'));
  const status = (REQUEST_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus as PayoutRequest['status']
    : rawStatus.includes('approv') || rawStatus.includes('paid') ? 'approved'
      : rawStatus.includes('fail') || rawStatus.includes('declin') ? 'failed'
        : 'pending';

  const kindRaw = normaliseEnum(str(row, ['kind', 'type', 'recipient_type'], 'rider'));

  return {
    id: str(row, ['reference', 'id', '_id'], '—'),
    who: nested(row, ['rider', 'vendor', 'recipient'], ['name', 'full_name', 'business_name'])
      || str(row, ['who', 'recipient_name'], '—'),
    kind: kindRaw.includes('vendor') ? 'Vendor' : 'Rider',
    amount: num(row, ['amount', 'total']),
    date: String(pick(row, ['created_at', 'createdAt', 'requested_at']) ?? '—').slice(0, 10),
    method: str(row, ['method', 'payout_method', 'channel'], '—'),
    number: str(row, ['number', 'account_number', 'phone', 'destination'], '—'),
    status,
  };
}

/** Response bodies vary: a bare array, {data: []}, or {data: {items: []}}. */
export function toArray(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload as Raw[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Raw;
    for (const key of ['items', 'results', 'rows', 'data', 'orders', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as Raw[];
    }
  }
  return [];
}
