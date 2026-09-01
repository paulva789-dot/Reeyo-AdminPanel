// Full vendor records — specification §4.
//
// The list view keeps the lightweight Vendor type; this is the profile behind
// it, with everything §4.1 asks for. Built from a compact seed for the same
// reason the orders are: a weekly schedule written out by hand seven times per
// vendor is unreadable and drifts.

import { regionOfZone, cityOfZone } from './geography';
import type { Region } from './geography';
import type {
  VendorProfile, DayHours, WalletEntry, CommissionRule, Vertical, Weekday,
} from './types';
import { WEEKDAYS } from './types';

function place(zone: string): { zone: string; city: string; region: Region } {
  const region = regionOfZone(zone);
  const city = cityOfZone(zone);
  if (!region || !city) throw new Error(`Unknown zone in vendor seed: ${zone}`);
  return { zone, city, region };
}

/** A uniform week, with an optional list of days that are closed. */
function week(
  opens: string,
  closes: string,
  options: { closed?: Weekday[]; lunchBreak?: boolean } = {},
): DayHours[] {
  const closed = new Set(options.closed ?? []);
  return WEEKDAYS.map((day) => {
    if (closed.has(day)) return { day, closed: true, slots: [] };
    if (options.lunchBreak) {
      return {
        day,
        closed: false,
        slots: [{ opens, closes: '14:00' }, { opens: '17:00', closes }],
      };
    }
    return { day, closed: false, slots: [{ opens, closes }] };
  });
}

let entrySeq = 0;

/** Builds a ledger back from the current balance, so the running total agrees. */
function ledger(
  balance: number,
  moves: { daysAgo: number; amount: number; source: WalletEntry['source']; reason: string; by?: string }[],
): WalletEntry[] {
  // Work forwards from the opening balance so balanceAfter is always the sum of
  // everything up to and including that row — the column has to reconcile, or
  // it is worse than not showing it.
  const opening = balance - moves.reduce((sum, m) => sum + m.amount, 0);
  let running = opening;

  return moves
    .slice()
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .map((move) => {
      running += move.amount;
      return {
        id: `WE-${++entrySeq}`,
        at: new Date(Date.now() - move.daysAgo * 86_400_000).toISOString(),
        amount: move.amount,
        balanceAfter: running,
        source: move.source,
        reason: move.reason,
        reference: move.source === 'settlement' ? `STL-${1000 + entrySeq}` : null,
        note: null,
        by: move.by ?? 'System',
        reverses: null,
      };
    })
    .reverse();
}

interface Seed {
  id: string;
  businessName: string;
  adminName: string;
  adminNumber: string;
  shortAddress: string;
  zone: string;
  lat: number;
  lng: number;
  category: string;
  service: Vertical;
  packagingFee?: number;
  hours: DayHours[];
  paymentName: string;
  paymentNumber: string;
  commission: CommissionRule;
  balance: number;
  joined: string;
  status: VendorProfile['status'];
  moves: Parameters<typeof ledger>[1];
}

const SEEDS: Seed[] = [
  {
    id: 'V-01', businessName: 'Chez Mado', adminName: 'Grace Nkeng',
    adminNumber: '699 71 40 05',
    shortAddress: 'Carrefour Molyko, opposite the campus gate',
    zone: 'Molyko', lat: 4.1560, lng: 9.2870,
    category: 'Restaurant', service: 'food', packagingFee: 300,
    hours: week('07:30', '22:00'),
    paymentName: 'Grace Nkeng', paymentNumber: '699 71 40 05',
    commission: { kind: 'percentage', value: 15 },
    balance: 412_500, joined: '2025-03-14', status: 'active',
    moves: [
      { daysAgo: 1, amount: 84_200, source: 'order', reason: 'Orders settled Monday' },
      { daysAgo: 3, amount: -250_000, source: 'settlement', reason: 'Weekly payout' },
      { daysAgo: 6, amount: 196_400, source: 'order', reason: 'Orders settled' },
      { daysAgo: 9, amount: -15_000, source: 'manual adjustment', reason: 'Packaging dispute refund', by: 'Adrian Nkeng' },
    ],
  },
  {
    id: 'V-02', businessName: 'GreenBowl', adminName: 'Sylvie Abena',
    adminNumber: '699 40 11 27',
    shortAddress: 'Molyko commercial avenue, next to the bookshop',
    zone: 'Molyko', lat: 4.1572, lng: 9.2840,
    category: 'Health food', service: 'food', packagingFee: 300,
    hours: week('08:00', '20:00', { closed: ['Sun'] }),
    paymentName: 'Sylvie Abena', paymentNumber: '677 30 14 92',
    commission: { kind: 'percentage', value: 12 },
    balance: 128_900, joined: '2025-06-02', status: 'active',
    moves: [
      { daysAgo: 2, amount: 46_800, source: 'order', reason: 'Orders settled' },
      { daysAgo: 8, amount: -90_000, source: 'settlement', reason: 'Weekly payout' },
    ],
  },
  {
    id: 'V-03', businessName: 'Pizza Palace', adminName: 'Ibrahim Njoya',
    adminNumber: '671 09 55 18',
    shortAddress: 'Great Soppo junction, above the hardware shop',
    zone: 'Great Soppo', lat: 4.1490, lng: 9.2380,
    category: 'Restaurant', service: 'food', packagingFee: 300,
    hours: week('11:00', '23:00'),
    paymentName: 'Pizza Palace SARL', paymentNumber: '671 09 55 18',
    commission: { kind: 'flat', value: 500 },
    balance: 318_400, joined: '2024-11-20', status: 'active',
    moves: [
      { daysAgo: 1, amount: 112_000, source: 'order', reason: 'Orders settled' },
      { daysAgo: 5, amount: -180_000, source: 'settlement', reason: 'Weekly payout' },
    ],
  },
  {
    id: 'V-04', businessName: 'UrbanMart', adminName: 'Marc Etoa',
    adminNumber: '677 22 90 14',
    shortAddress: 'Bonduma main road, beside the filling station',
    zone: 'Bonduma', lat: 4.1610, lng: 9.2600,
    category: 'Supermarket', service: 'grocery',
    hours: week('07:00', '21:00'),
    paymentName: 'UrbanMart Ltd', paymentNumber: '677 22 90 14',
    commission: { kind: 'percentage', value: 10 },
    balance: 806_200, joined: '2024-08-05', status: 'active',
    moves: [
      { daysAgo: 1, amount: 244_000, source: 'order', reason: 'Orders settled' },
      { daysAgo: 4, amount: -400_000, source: 'settlement', reason: 'Weekly payout' },
      { daysAgo: 7, amount: 310_500, source: 'order', reason: 'Orders settled' },
    ],
  },
  {
    id: 'V-05', businessName: 'Pharma Plus', adminName: 'Clarisse Eto',
    adminNumber: '677 63 20 51',
    shortAddress: 'Bonduma, behind the health centre',
    zone: 'Bonduma', lat: 4.1595, lng: 9.2630,
    category: 'Pharmacy', service: 'grocery',
    hours: week('08:00', '19:00', { lunchBreak: true }),
    paymentName: 'Pharma Plus', paymentNumber: '677 63 20 51',
    commission: { kind: 'percentage', value: 8 },
    balance: 94_100, joined: '2025-01-19', status: 'paused',
    moves: [
      { daysAgo: 3, amount: 31_200, source: 'order', reason: 'Orders settled' },
      { daysAgo: 12, amount: -60_000, source: 'settlement', reason: 'Weekly payout' },
    ],
  },
  {
    id: 'V-06', businessName: 'Buea Express', adminName: 'Peter Samu',
    adminNumber: '675 22 88 31',
    shortAddress: 'Molyko counter, opposite the taxi park',
    zone: 'Molyko', lat: 4.1545, lng: 9.2895,
    category: 'Courier agent', service: 'parcel',
    hours: week('07:00', '19:00', { closed: ['Sun'] }),
    paymentName: 'Buea Express', paymentNumber: '675 22 88 31',
    commission: { kind: 'percentage', value: 20 },
    balance: 152_700, joined: '2025-02-11', status: 'active',
    moves: [
      { daysAgo: 2, amount: 58_400, source: 'order', reason: 'Parcels settled' },
      { daysAgo: 9, amount: -120_000, source: 'settlement', reason: 'Weekly payout' },
    ],
  },
  {
    id: 'V-07', businessName: 'Akwa Bakery', adminName: 'Chantal Meka',
    adminNumber: '675 22 88 31',
    shortAddress: 'Rue Joss, Akwa, beside the pharmacy',
    zone: 'Akwa', lat: 4.0500, lng: 9.7000,
    category: 'Bakery', service: 'food', packagingFee: 200,
    hours: week('06:00', '20:00'),
    paymentName: 'Akwa Bakery', paymentNumber: '699 18 63 40',
    commission: { kind: 'percentage', value: 15 },
    balance: 221_800, joined: '2025-05-27', status: 'active',
    moves: [
      { daysAgo: 1, amount: 71_300, source: 'order', reason: 'Orders settled' },
      { daysAgo: 6, amount: -140_000, source: 'settlement', reason: 'Weekly payout' },
    ],
  },
  {
    id: 'V-08', businessName: 'Nkwen Corner Store', adminName: 'Emmanuel Che',
    adminNumber: '671 88 02 45',
    shortAddress: 'Nkwen, past the roundabout on the right',
    zone: 'Nkwen', lat: 5.9800, lng: 10.1750,
    category: 'Provisions', service: 'grocery',
    hours: week('07:30', '20:30'),
    paymentName: 'Emmanuel Che', paymentNumber: '671 88 02 45',
    commission: { kind: 'flat', value: 400 },
    balance: 0, joined: '2026-08-21', status: 'suspended',
    moves: [
      { daysAgo: 2, amount: -18_000, source: 'manual adjustment', reason: 'Chargeback on a disputed order', by: 'Adrian Nkeng' },
      { daysAgo: 2, amount: 18_000, source: 'order', reason: 'Orders settled' },
    ],
  },
];

export const vendorProfiles: VendorProfile[] = SEEDS.map((seed) => ({
  id: seed.id,
  businessName: seed.businessName,
  adminName: seed.adminName,
  adminNumber: seed.adminNumber,
  shortAddress: seed.shortAddress,
  mapsAddress: `${seed.lat},${seed.lng}`,
  lat: seed.lat,
  lng: seed.lng,
  ...place(seed.zone),
  category: seed.category,
  service: seed.service,
  imageUrl: null,
  packagingFee: seed.packagingFee ?? null,
  hours: seed.hours,
  specialDates: [],
  paymentName: seed.paymentName,
  paymentNumber: seed.paymentNumber,
  commission: seed.commission,
  walletBalance: seed.balance,
  wallet: ledger(seed.balance, seed.moves),
  joined: seed.joined,
  status: seed.status,
}));

/** The platform default, pre-filled for a new vendor (§4.3). */
export const DEFAULT_COMMISSION: CommissionRule = { kind: 'percentage', value: 15 };

/** Is the vendor open at this moment, by its own schedule? */
export function isOpenNow(profile: VendorProfile, now = new Date()): boolean {
  if (profile.status !== 'active') return false;

  const iso = now.toISOString().slice(0, 10);
  const special = profile.specialDates.find((d) => d.date === iso);
  if (special) return !special.closed;

  const day = WEEKDAYS[(now.getDay() + 6) % 7];
  const today = profile.hours.find((h) => h.day === day);
  if (!today || today.closed) return false;

  const minutes = now.getHours() * 60 + now.getMinutes();
  return today.slots.some((slot) => {
    const [oh, om] = slot.opens.split(':').map(Number);
    const [ch, cm] = slot.closes.split(':').map(Number);
    return minutes >= oh * 60 + om && minutes < ch * 60 + cm;
  });
}
