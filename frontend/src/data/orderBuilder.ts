// Builds a full Order (spec §3) from a compact seed row.
//
// The specification asks every order to carry a basket, both parties with
// coordinates, a timeline, a distance and a frozen set of fees. Writing all of
// that out by hand twenty-two times would be unreadable and would drift out of
// step with itself; the seed states what is particular to an order and this
// derives the rest, consistently.

import { regionOfZone, cityOfZone } from './geography';
import type { Region } from './geography';
import type {
  Order, OrderStage, OrderEvent, OrderRider, Party, BasketLine,
  ParcelDetails, PaymentMethod, PaymentStatus, Vertical,
} from './types';
import { ORDER_FLOW } from './types';

/**
 * Approximate centres for the zones the seed uses, so map pins and the
 * distance band land in the right place. Anything not listed falls back to
 * Buea — good enough to plot, and never presented as survey data.
 */
const ZONE_POINTS: Record<string, [number, number]> = {
  Molyko: [4.1560, 9.2870], Bonduma: [4.1610, 9.2600], 'Great Soppo': [4.1490, 9.2380],
  'Mile 16': [4.0830, 9.2480], Muea: [4.1750, 9.3300],
  Akwa: [4.0500, 9.7000], Bonanjo: [4.0430, 9.6870], Deido: [4.0620, 9.7050],
  'Bonabéri': [4.0700, 9.6600], Makepe: [4.0850, 9.7420],
  Bastos: [3.8900, 11.5100], Mvan: [3.8180, 11.5230], Nlongkak: [3.8830, 11.5150],
  'Mvog-Mbi': [3.8560, 11.5290],
  'Commercial Avenue': [5.9600, 10.1460], Nkwen: [5.9800, 10.1750],
  Baladji: [7.3200, 13.5840], Dang: [7.4200, 13.5600],
  Nkolngok: [3.5200, 11.5000], Nkolbikon: [4.5770, 13.6840],
  Domayo: [10.5900, 14.3150], Djarengol: [10.6050, 14.3300],
};

const FALLBACK: [number, number] = [4.1560, 9.2870];

function pointFor(zone: string): [number, number] {
  return ZONE_POINTS[zone] ?? FALLBACK;
}

/** Kilometres between two points, on a sphere. */
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function place(zone: string): { zone: string; city: string; region: Region } {
  const region = regionOfZone(zone);
  const city = cityOfZone(zone);
  if (!region || !city) throw new Error(`Unknown zone in order seed: ${zone}`);
  return { zone, city, region };
}

/** A basket line, stated compactly. */
export interface SeedLine {
  name: string;
  qty?: number;
  price: number;
  options?: { label: string; price: number }[];
  note?: string;
}

export interface OrderSeed {
  id: string;
  vertical: Vertical;
  stage: OrderStage;
  customer: string;
  vendor: string;
  fromZone: string;
  toZone: string;
  customerPhone: string;
  vendorPhone: string;
  fromAddress: string;
  toAddress: string;
  toAddressNote?: string;
  lines: SeedLine[];
  rider?: Omit<OrderRider, 'earnings'> & { earnings?: number };
  packagingFee?: number;
  discount?: { code: string; campaign: string; amount: number };
  surcharges?: { label: string; amount: number }[];
  payment: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  orderNote?: string;
  /** Minutes before now that the order was placed. */
  minutesAgo: number;
  /** Promised minutes from placing to delivery. */
  etaMinutes: number;
  late?: boolean;
  endedReason?: string;
  parcel?: Partial<ParcelDetails>;
}

/** §6.1 — the fee for a distance, from the band table. */
export function feeForDistance(km: number, bands: number[], perKmBeyond: number): number {
  if (km <= bands.length) {
    const index = Math.min(Math.max(Math.ceil(km) - 1, 0), bands.length - 1);
    return bands[index];
  }
  const overflow = km - bands.length;
  return bands[bands.length - 1] + Math.round(overflow * perKmBeyond);
}

const BANDS = [500, 700, 900, 1100, 1300];
const PER_KM_BEYOND = 250;

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function ago(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Who moves an order into each stage, when nothing more specific is known. */
const ACTOR: Record<OrderStage, string> = {
  pending: 'Customer',
  confirmed: 'Vendor',
  'ready for pickup': 'Vendor',
  'rider assigned': 'Dispatch',
  'picked up': 'Rider',
  'in transit': 'Rider',
  delivered: 'Rider',
  cancelled: 'Admin',
  failed: 'Admin',
};

function buildTimeline(seed: OrderSeed): OrderEvent[] {
  const terminal = seed.stage === 'cancelled' || seed.stage === 'failed';
  // A terminated order got as far as it got before it stopped.
  const reachedIndex = terminal
    ? ORDER_FLOW.indexOf('rider assigned')
    : ORDER_FLOW.indexOf(seed.stage);

  const reached = ORDER_FLOW.slice(0, reachedIndex + 1);
  const span = seed.minutesAgo;

  const events: OrderEvent[] = reached.map((stage, i) => ({
    stage,
    // Spread the stages evenly across the time the order has existed.
    at: iso(span - (span * i) / Math.max(reached.length, 1)),
    by: ACTOR[stage],
    reason: null,
    note: null,
  }));

  if (terminal) {
    events.push({
      stage: seed.stage,
      at: iso(Math.max(0, span * 0.15)),
      by: 'Adrian Nkeng',
      reason: seed.endedReason ?? 'Vendor closed',
      note: null,
    });
  }
  return events;
}

export function buildOrder(seed: OrderSeed): Order {
  const fromPlace = place(seed.fromZone);
  const toPlace = place(seed.toZone);
  const fromPoint = pointFor(seed.fromZone);
  const toPoint = pointFor(seed.toZone);

  const distanceKm = Math.round(haversineKm(fromPoint, toPoint) * 10) / 10;
  const deliveryFee = feeForDistance(distanceKm, BANDS, PER_KM_BEYOND);

  const basket: BasketLine[] = seed.lines.map((line, i) => ({
    id: `${seed.id}-L${i + 1}`,
    name: line.name,
    quantity: line.qty ?? 1,
    unitPrice: line.price,
    options: line.options ?? [],
    note: line.note ?? null,
    imageUrl: null,
  }));

  const subtotal = basket.reduce(
    (sum, l) => sum + l.quantity * l.unitPrice
      + l.options.reduce((o, opt) => o + opt.price, 0),
    0,
  );

  const packagingFee = seed.packagingFee ?? 0;
  const surcharges = seed.surcharges ?? [];
  const surchargeTotal = surcharges.reduce((s, x) => s + x.amount, 0);
  const discountAmount = seed.discount?.amount ?? 0;
  const total = subtotal + packagingFee + deliveryFee + surchargeTotal - discountAmount;

  // The commission rule in force is frozen onto the order (§4.3).
  const commission = Math.round(subtotal * 0.15);

  const from: Party = {
    name: seed.vendor,
    phone: seed.vendorPhone,
    address: seed.fromAddress,
    addressNote: null,
    ...fromPlace,
    lat: fromPoint[0],
    lng: fromPoint[1],
  };

  const to: Party = {
    name: seed.customer,
    phone: seed.customerPhone,
    address: seed.toAddress,
    addressNote: seed.toAddressNote ?? null,
    ...toPlace,
    lat: toPoint[0],
    lng: toPoint[1],
  };

  const delivered = seed.stage === 'delivered';
  const ended = delivered || seed.stage === 'cancelled' || seed.stage === 'failed';
  const remaining = seed.etaMinutes - seed.minutesAgo;

  const riderDetail: OrderRider | null = seed.rider
    ? { ...seed.rider, earnings: seed.rider.earnings ?? Math.round(deliveryFee * 0.9) }
    : null;

  return {
    id: seed.id,
    vertical: seed.vertical,
    status: seed.stage,
    customer: seed.customer,
    vendor: seed.vendor,
    from,
    to,
    rider: riderDetail?.name ?? null,
    riderDetail,
    items: basket
      .map((l) => (l.quantity > 1 ? `${l.quantity} × ${l.name}` : l.name))
      .join(' · '),
    basket,
    packagingFee,
    deliveryFee,
    discount: seed.discount ?? null,
    commission,
    surcharges,
    total,
    payment: seed.payment,
    paymentStatus: seed.paymentStatus
      ?? (delivered ? 'Paid' : seed.payment === 'Cash on delivery' ? 'Unpaid' : 'Paid'),
    paymentReference: seed.paymentReference ?? null,
    orderNote: seed.orderNote ?? null,
    ...toPlace,
    distanceKm,
    placedAt: iso(seed.minutesAgo),
    placedAgo: ago(seed.minutesAgo),
    timeline: buildTimeline(seed),
    eta: ended ? 'done' : seed.late ? `late ${Math.abs(remaining)} min` : `${Math.max(1, remaining)} min`,
    isLate: Boolean(seed.late),
    fulfilmentMinutes: delivered ? seed.minutesAgo : null,
    parcel: seed.vertical === 'parcel'
      ? {
        description: seed.parcel?.description ?? 'Documents envelope',
        declaredValue: seed.parcel?.declaredValue ?? 0,
        sizeBand: seed.parcel?.sizeBand ?? 'Small',
        weightKg: seed.parcel?.weightKg ?? null,
        fragile: seed.parcel?.fragile ?? false,
        recipientName: seed.parcel?.recipientName ?? null,
        recipientPhone: seed.parcel?.recipientPhone ?? null,
        signedBy: seed.parcel?.signedBy ?? null,
        proofPhotoUrl: null,
      }
      : null,
    acknowledged: seed.stage !== 'pending',
  };
}
