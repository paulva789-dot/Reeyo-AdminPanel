import { regionOfZone, cityOfZone } from './geography';
import type { Region } from './geography';
import type {
  Vendor, Rider, Customer, Payment, PayoutRequest, Offer,
  MenuCategory, Announcement, SpinPrize, Team, FeeRule, RiderPosition,
  Dispute, MenuApproval, ApiKey,
} from './types';

/**
 * Fills in city and region from the zone, so a seed record only ever states
 * the neighbourhood and the rollup can never contradict geography.ts.
 */
function place(zone: string): { zone: string; city: string; region: Region } {
  const region = regionOfZone(zone);
  const city = cityOfZone(zone);
  if (!region || !city) {
    throw new Error(`Seed uses a zone that is not in geography.ts: ${zone}`);
  }
  return { zone, city, region };
}

export const PAYMENT_METHODS = [
  'MTN Mobile Money', 'Orange Money', 'Cash on delivery', 'Card', 'Bank transfer',
];

/* Orders — 12, all three verticals, every live stage, one delayed, one cancelled. */
export { orders } from './orderSeed';

/* Vendors — 4 food, 3 grocery, 1 parcel. One suspended, one under review. */
export const vendors: Vendor[] = [
  {
    id: 'V-101', name: 'Chez Mado', vertical: 'food', category: 'Cameroonian',
    ...place('Molyko'), orders: 412, revenue: 2140000, rating: 4.8,
    prepMinutes: 18, status: 'active', joined: '2024-03-12',
  },
  {
    id: 'V-102', name: 'GreenBowl', vertical: 'food', category: 'Healthy',
    ...place('Bonduma'), orders: 287, revenue: 1290000, rating: 4.6,
    prepMinutes: 14, status: 'active', joined: '2024-06-02',
  },
  {
    id: 'V-103', name: 'Pizza Palace', vertical: 'food', category: 'Pizza',
    ...place('Great Soppo'), orders: 356, revenue: 1830000, rating: 4.3,
    prepMinutes: 22, status: 'active', joined: '2024-01-28',
  },
  {
    id: 'V-104', name: 'Mama Grill', vertical: 'food', category: 'Grill',
    ...place('Muea'), orders: 78, revenue: 340000, rating: 3.9,
    prepMinutes: 31, status: 'review', joined: '2025-11-19',
  },
  {
    id: 'V-201', name: 'UrbanMart', vertical: 'grocery', category: 'Supermarket',
    ...place('Molyko'), orders: 508, revenue: 3120000, rating: 4.7,
    prepMinutes: 25, status: 'active', joined: '2023-11-04',
  },
  {
    id: 'V-202', name: 'Pharma Plus', vertical: 'grocery', category: 'Pharmacy',
    ...place('Mile 16'), orders: 193, revenue: 870000, rating: 4.9,
    prepMinutes: 11, status: 'active', joined: '2024-08-21',
  },
  {
    id: 'V-203', name: 'Fresh Corner', vertical: 'grocery', category: 'Produce',
    ...place('Bonduma'), orders: 64, revenue: 210000, rating: 3.6,
    prepMinutes: 29, status: 'suspended', joined: '2025-02-14',
  },
  {
    id: 'V-301', name: 'Buea Express', vertical: 'parcel', category: 'Courier agent',
    ...place('Molyko'), orders: 631, revenue: 1460000, rating: 4.5,
    prepMinutes: 6, status: 'active', joined: '2023-09-30',
  },

  {
    id: 'V-401', name: 'Chez Wou', vertical: 'food', category: 'Cameroonian',
    ...place('Akwa'), orders: 921, revenue: 5240000, rating: 4.7,
    prepMinutes: 21, status: 'active', joined: '2023-06-14',
  },
  {
    id: 'V-402', name: 'Douala Fresh', vertical: 'grocery', category: 'Market grocer',
    ...place('Deido'), orders: 640, revenue: 2980000, rating: 4.4,
    prepMinutes: 27, status: 'active', joined: '2024-02-09',
  },
  {
    id: 'V-403', name: 'Douala Courier', vertical: 'parcel', category: 'Courier agent',
    ...place('Bonanjo'), orders: 1180, revenue: 3410000, rating: 4.6,
    prepMinutes: 5, status: 'active', joined: '2023-04-22',
  },
  {
    id: 'V-501', name: 'Bastos Kitchen', vertical: 'food', category: 'Grill',
    ...place('Bastos'), orders: 512, revenue: 2760000, rating: 4.5,
    prepMinutes: 24, status: 'active', joined: '2024-05-30',
  },
  {
    id: 'V-502', name: 'Yaounde Market Co', vertical: 'grocery', category: 'Supermarket',
    ...place('Mvan'), orders: 388, revenue: 1940000, rating: 4.2,
    prepMinutes: 30, status: 'active', joined: '2024-09-11',
  },
  {
    id: 'V-601', name: 'Bamenda Grill', vertical: 'food', category: 'Traditional',
    ...place('Commercial Avenue'), orders: 274, revenue: 1180000, rating: 4.6,
    prepMinutes: 26, status: 'active', joined: '2025-01-17',
  },
  {
    id: 'V-602', name: 'Nkwen Provisions', vertical: 'grocery', category: 'Provisions',
    ...place('Nkwen'), orders: 96, revenue: 420000, rating: 3.8,
    prepMinutes: 33, status: 'review', joined: '2026-02-03',
  },
  {
    id: 'V-701', name: 'Bafoussam Bites', vertical: 'food', category: 'Cameroonian',
    ...place('Kamkop'), orders: 143, revenue: 610000, rating: 4.1,
    prepMinutes: 28, status: 'active', joined: '2025-07-25',
  },
  {
    id: 'V-801', name: 'Kribi Runners', vertical: 'parcel', category: 'Courier agent',
    ...place('Mboa Manga'), orders: 58, revenue: 190000, rating: 3.5,
    prepMinutes: 9, status: 'suspended', joined: '2025-11-08',
  },
  {
    id: 'V-802', name: 'Limbe Seafood', vertical: 'food', category: 'Seafood',
    ...place('Down Beach'), orders: 331, revenue: 1720000, rating: 4.8,
    prepMinutes: 19, status: 'active', joined: '2024-04-16',
  },
];

/* Only Chez Mado has a published menu — every other vendor reaches the empty state. */
export const menus: Record<string, MenuCategory[]> = {
  'V-101': [
    {
      id: 'C-1', name: 'Main dishes', visible: true,
      opens: '10:00', closes: '22:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      items: [
        {
          id: 'I-1', name: 'Ndolé with plantain', price: 3500, wasPrice: 4000,
          stock: 24, addOns: 3, available: true,
        },
        {
          id: 'I-2', name: 'Poulet DG', price: 5500, wasPrice: null,
          stock: 12, addOns: 2, available: true,
        },
        {
          id: 'I-3', name: 'Grilled fish', price: 4200, wasPrice: null,
          stock: 0, addOns: 4, available: false,
        },
      ],
    },
    {
      id: 'C-2', name: 'Drinks', visible: true,
      opens: '10:00', closes: '23:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      items: [
        {
          id: 'I-4', name: 'Fresh juice', price: 1200, wasPrice: 1500,
          stock: 40, addOns: 1, available: true,
        },
        {
          id: 'I-5', name: 'Soft drink', price: 800, wasPrice: null,
          stock: 63, addOns: 0, available: true,
        },
      ],
    },
  ],
};

/* Riders — mixed states, one below 4.2. */
export const riders: Rider[] = [
  {
    id: 'R-01', name: 'Eric Njume', ...place('Molyko'), vehicle: 'Moto',
    trips: 345, rating: 4.8, owed: 96200, state: 'on a delivery', phone: '675 11 22 33',
  },
  {
    id: 'R-02', name: 'Sarah Ngo', ...place('Muea'), vehicle: 'Moto',
    trips: 289, rating: 4.6, owed: 74500, state: 'on a delivery', phone: '677 45 78 12',
  },
  {
    id: 'R-03', name: 'Divine Ako', ...place('Great Soppo'), vehicle: 'Moto',
    trips: 412, rating: 4.9, owed: 118300, state: 'on a delivery', phone: '699 03 56 41',
  },
  {
    id: 'R-04', name: 'Blaise Fon', ...place('Bonduma'), vehicle: 'Car',
    trips: 156, rating: 3.9, owed: 43800, state: 'running late', phone: '671 88 90 04',
  },
  {
    id: 'R-05', name: 'Nadine Bih', ...place('Mile 16'), vehicle: 'Moto',
    trips: 203, rating: 4.4, owed: 51900, state: 'idle', phone: '678 21 34 67',
  },
  {
    id: 'R-06', name: 'Joseph Tabi', ...place('Molyko'), vehicle: 'Bicycle',
    trips: 88, rating: 4.2, owed: 19400, state: 'idle', phone: '676 55 12 89',
  },

  {
    id: 'R-07', name: 'Landry Mbappe', ...place('Akwa'), vehicle: 'Moto',
    trips: 612, rating: 4.7, owed: 154200, state: 'on a delivery', phone: '677 90 11 24',
  },
  {
    id: 'R-08', name: 'Carine Awono', ...place('Bastos'), vehicle: 'Moto',
    trips: 438, rating: 4.5, owed: 108600, state: 'running late', phone: '699 34 77 08',
  },
  {
    id: 'R-09', name: 'Emmanuel Ndifor', ...place('Commercial Avenue'), vehicle: 'Moto',
    trips: 221, rating: 4.3, owed: 62100, state: 'on a delivery', phone: '675 42 19 63',
  },
  {
    id: 'R-10', name: 'Aline Tchoumi', ...place('Kamkop'), vehicle: 'Bicycle',
    trips: 117, rating: 4.0, owed: 28900, state: 'on a delivery', phone: '678 65 30 22',
  },
  {
    id: 'R-11', name: 'Beltus Efande', ...place('Down Beach'), vehicle: 'Moto',
    trips: 305, rating: 4.6, owed: 81400, state: 'idle', phone: '676 12 88 47',
  },
  {
    id: 'R-12', name: 'Fadimatou Bello', ...place('Domayo'), vehicle: 'Moto',
    trips: 64, rating: 3.7, owed: 15300, state: 'idle', phone: '671 55 02 19',
  },
];

export const riderPositions: RiderPosition[] = [
  { riderId: 'R-01', x: 26, y: 34 },
  { riderId: 'R-02', x: 71, y: 58 },
  { riderId: 'R-03', x: 48, y: 22 },
  { riderId: 'R-04', x: 62, y: 74 },
  { riderId: 'R-05', x: 18, y: 66 },
  { riderId: 'R-06', x: 84, y: 41 },
];

/* Customers — all four segments represented. */
export const customers: Customer[] = [
  {
    id: 'CU-01', name: 'Anna Mbella', ...place('Molyko'), orders: 63, spend: 412000,
    lastOrder: '2026-08-22', rating: 4.9, segment: 'loyal',
  },
  {
    id: 'CU-02', name: 'Marc Etoa', ...place('Bonduma'), orders: 41, spend: 268000,
    lastOrder: '2026-08-22', rating: 4.6, segment: 'loyal',
  },
  {
    id: 'CU-03', name: 'Peter Samu', ...place('Molyko'), orders: 18, spend: 96000,
    lastOrder: '2026-08-21', rating: 4.4, segment: 'active',
  },
  {
    id: 'CU-04', name: 'Sarah Ngo', ...place('Mile 16'), orders: 22, spend: 131000,
    lastOrder: '2026-08-20', rating: 4.7, segment: 'active',
  },
  {
    id: 'CU-05', name: 'Clarisse Eto', ...place('Great Soppo'), orders: 9, spend: 47000,
    lastOrder: '2026-08-22', rating: 4.5, segment: 'active',
  },
  {
    id: 'CU-06', name: 'Brenda Manga', ...place('Muea'), orders: 2, spend: 11400,
    lastOrder: '2026-08-19', rating: 4.0, segment: 'new',
  },
  {
    id: 'CU-07', name: 'Samuel Ndip', ...place('Bonduma'), orders: 27, spend: 154000,
    lastOrder: '2026-05-03', rating: 4.2, segment: 'lapsed',
  },

  {
    id: 'CU-08', name: 'Estelle Nana', ...place('Akwa'), orders: 88, spend: 604000,
    lastOrder: '2026-08-24', rating: 4.8, segment: 'loyal',
  },
  {
    id: 'CU-09', name: 'Yannick Bile', ...place('Deido'), orders: 31, spend: 197000,
    lastOrder: '2026-08-24', rating: 4.5, segment: 'active',
  },
  {
    id: 'CU-10', name: 'Rodrigue Fotso', ...place('Bastos'), orders: 54, spend: 348000,
    lastOrder: '2026-08-23', rating: 4.6, segment: 'loyal',
  },
  {
    id: 'CU-11', name: 'Nadege Owona', ...place('Mvan'), orders: 12, spend: 71000,
    lastOrder: '2026-08-22', rating: 4.3, segment: 'active',
  },
  {
    id: 'CU-12', name: 'Ernest Tabi', ...place('Commercial Avenue'), orders: 7, spend: 39000,
    lastOrder: '2026-08-23', rating: 4.1, segment: 'active',
  },
  {
    id: 'CU-13', name: 'Serge Kamdem', ...place('Kamkop'), orders: 3, spend: 14200,
    lastOrder: '2026-08-24', rating: 4.4, segment: 'new',
  },
  {
    id: 'CU-14', name: 'Marthe Eyenga', ...place('Mboa Manga'), orders: 19, spend: 108000,
    lastOrder: '2026-04-11', rating: 3.9, segment: 'lapsed',
  },
];

/* Payments — 7, one failed. */
export const payments: Payment[] = [
  {
    id: 'PAY-2061', date: '2026-08-22', amount: 8400, from: 'Anna Mbella',
    to: 'Chez Mado', method: 'MTN Mobile Money', reason: 'Order F-2841',
    status: 'completed',
  },
  {
    id: 'PAY-2060', date: '2026-08-22', amount: 12600, from: 'Marc Etoa',
    to: 'UrbanMart', method: 'Orange Money', reason: 'Order S-1192',
    status: 'completed',
  },
  {
    id: 'PAY-2059', date: '2026-08-22', amount: 96200, from: 'reeyo',
    to: 'Eric Njume', method: 'MTN Mobile Money', reason: 'Weekly rider settlement',
    status: 'pending',
  },
  {
    id: 'PAY-2058', date: '2026-08-21', amount: 9800, from: 'Clarisse Eto',
    to: 'Pizza Palace', method: 'Card', reason: 'Order F-2839',
    status: 'completed',
  },
  {
    id: 'PAY-2057', date: '2026-08-21', amount: 4700, from: 'Marc Etoa',
    to: 'UrbanMart', method: 'Cash on delivery', reason: 'Order S-1179 refund',
    status: 'failed',
  },
  {
    id: 'PAY-2056', date: '2026-08-21', amount: 434700, from: 'reeyo',
    to: 'Chez Mado', method: 'Bank transfer', reason: 'Weekly vendor settlement',
    status: 'completed',
  },
  {
    id: 'PAY-2055', date: '2026-08-20', amount: 3200, from: 'Anna Mbella',
    to: 'Buea Express', method: 'MTN Mobile Money', reason: 'Order P-0769',
    status: 'completed',
  },
];

/* Payout requests — 4, three pending. */
export const payoutRequests: PayoutRequest[] = [
  {
    id: 'REQ-118', who: 'Eric Njume', kind: 'Rider', amount: 96200,
    date: '2026-08-20', method: 'MTN Mobile Money', number: '675 11 22 33',
    status: 'pending',
  },
  {
    id: 'REQ-117', who: 'Divine Ako', kind: 'Rider', amount: 118300,
    date: '2026-08-21', method: 'Orange Money', number: '699 03 56 41',
    status: 'pending',
  },
  {
    id: 'REQ-116', who: 'UrbanMart', kind: 'Vendor', amount: 220200,
    date: '2026-08-21', method: 'Bank transfer', number: 'AFB 4471 0092',
    status: 'pending',
  },
  {
    id: 'REQ-115', who: 'Pharma Plus', kind: 'Vendor', amount: 87400,
    date: '2026-08-18', method: 'Bank transfer', number: 'UBA 8830 1145',
    status: 'approved',
  },
];

export const offers: Offer[] = [
  {
    id: 1, name: 'Molyko lunch rush', code: 'LUNCH15', vertical: 'Food',
    ...place('Molyko'), type: 'Percent off', value: '15%', payer: 'Split 50/50',
    uses: 342, spent: 214000, active: true, ends: '2026-09-15',
  },
  {
    id: 2, name: 'First grocery order', code: 'FRESH1000', vertical: 'Grocery',
    zone: 'All zones', type: 'Amount off', value: 'FCFA 1 000', payer: 'Platform',
    uses: 128, spent: 128000, active: true, ends: '2026-08-31',
  },
  {
    id: 3, name: 'Parcel weekend', code: 'SENDFREE', vertical: 'Parcel',
    ...place('Bonduma'), type: 'Free delivery', value: 'Delivery waived', payer: 'Vendor',
    uses: 76, spent: 60800, active: false, ends: '2026-08-10',
  },
];

export const homeSections = [
  { id: 1, name: 'Search and zone picker', active: true },
  { id: 2, name: 'Promotional banners', active: true },
  { id: 3, name: 'Order again', active: true },
  { id: 4, name: 'Food near you', active: true },
  { id: 5, name: 'Grocery essentials', active: true },
  { id: 6, name: 'Send a parcel', active: false },
];

export const announcements: Announcement[] = [
  {
    id: 1, headline: 'Free delivery in Molyko this Friday',
    message: 'All food orders in Molyko ship free between 11:00 and 15:00.',
    audience: 'Customers · Molyko', channel: 'Push notification',
    sent: '2026-08-20', reach: 3420, openRate: 62,
  },
  {
    id: 2, headline: 'New payout schedule for riders',
    message: 'Rider settlements now run every Monday instead of Wednesday.',
    audience: 'Riders · All zones', channel: 'In-app message',
    sent: '2026-08-17', reach: 148, openRate: 91,
  },
  {
    id: 3, headline: 'Update your menu photos',
    message: 'Vendors with photographed items see 24% more orders.',
    audience: 'Vendors · All zones', channel: 'Email',
    sent: '2026-08-12', reach: 86, openRate: 47,
  },
];

export const spinPrizes: SpinPrize[] = [
  { id: 1, name: 'FCFA 500 off', weight: 35, colourToken: 'food' },
  { id: 2, name: 'Free delivery', weight: 25, colourToken: 'grocery' },
  { id: 3, name: 'FCFA 1 000 off', weight: 20, colourToken: 'parcel' },
  { id: 4, name: '10% off next order', weight: 15, colourToken: 'watch' },
  { id: 5, name: 'FCFA 5 000 off', weight: 5, colourToken: 'go' },
];

export const teams: Team[] = [
  {
    id: 'T-1', name: 'Molyko core', lead: 'Eric Njume', size: 8,
    ...place('Molyko'), shift: '08:00 – 16:00', load: 72,
  },
  {
    id: 'T-2', name: 'Bonduma runners', lead: 'Blaise Fon', size: 6,
    ...place('Bonduma'), shift: '10:00 – 18:00', load: 48,
  },
  {
    id: 'T-3', name: 'Soppo evening', lead: 'Divine Ako', size: 5,
    ...place('Great Soppo'), shift: '14:00 – 22:00', load: 84,
  },
  {
    id: 'T-4', name: 'Mile 16 relay', lead: 'Nadine Bih', size: 4,
    ...place('Mile 16'), shift: '09:00 – 17:00', load: 31,
  },

  {
    id: 'T-5', name: 'Akwa core', lead: 'Landry Mbappe', size: 12,
    ...place('Akwa'), shift: '07:00 – 15:00', load: 88,
  },
  {
    id: 'T-6', name: 'Bastos evening', lead: 'Carine Awono', size: 10,
    ...place('Bastos'), shift: '14:00 – 22:00', load: 69,
  },
  {
    id: 'T-7', name: 'Bamenda central', lead: 'Emmanuel Ndifor', size: 6,
    ...place('Commercial Avenue'), shift: '09:00 – 17:00', load: 66,
  },
];

export const feeRules: FeeRule[] = [
  {
    id: 'FR-1', name: 'Standard', baseFare: 500, perKm: 150,
    condition: 'Any order under 5 km', active: true,
  },
  {
    id: 'FR-2', name: 'Long distance', baseFare: 800, perKm: 200,
    condition: 'Orders over 5 km', active: true,
  },
  {
    id: 'FR-3', name: 'Peak hours', baseFare: 700, perKm: 180,
    condition: '11:00 – 14:00 and 18:00 – 21:00', active: true,
  },
  {
    id: 'FR-4', name: 'Parcel', baseFare: 1000, perKm: 220,
    condition: 'Parcel vertical, any distance', active: false,
  },
];

/* Capacity per delivery zone, across every region reeyo is live in. */
export const zoneStats = [
  { ...place('Molyko'), riders: 8, activeOrders: 14, capacity: 72, avgMinutes: 24 },
  { ...place('Bonduma'), riders: 6, activeOrders: 7, capacity: 48, avgMinutes: 27 },
  { ...place('Great Soppo'), riders: 5, activeOrders: 11, capacity: 84, avgMinutes: 33 },
  { ...place('Mile 16'), riders: 4, activeOrders: 3, capacity: 31, avgMinutes: 22 },
  { ...place('Muea'), riders: 3, activeOrders: 5, capacity: 63, avgMinutes: 38 },
  { ...place('Down Beach'), riders: 4, activeOrders: 6, capacity: 55, avgMinutes: 29 },
  { ...place('Akwa'), riders: 12, activeOrders: 26, capacity: 88, avgMinutes: 31 },
  { ...place('Bonanjo'), riders: 9, activeOrders: 15, capacity: 61, avgMinutes: 26 },
  { ...place('Deido'), riders: 7, activeOrders: 12, capacity: 74, avgMinutes: 34 },
  { ...place('Makepe'), riders: 6, activeOrders: 9, capacity: 47, avgMinutes: 28 },
  { ...place('Bastos'), riders: 10, activeOrders: 18, capacity: 69, avgMinutes: 27 },
  { ...place('Mvan'), riders: 6, activeOrders: 8, capacity: 42, avgMinutes: 30 },
  { ...place('Nlongkak'), riders: 5, activeOrders: 11, capacity: 78, avgMinutes: 33 },
  { ...place('Commercial Avenue'), riders: 6, activeOrders: 10, capacity: 66, avgMinutes: 32 },
  { ...place('Nkwen'), riders: 4, activeOrders: 5, capacity: 38, avgMinutes: 25 },
  { ...place('Kamkop'), riders: 3, activeOrders: 4, capacity: 44, avgMinutes: 36 },
  { ...place('Mboa Manga'), riders: 2, activeOrders: 3, capacity: 51, avgMinutes: 41 },
];

/* Series for the hand-rolled charts — section 9. */
export const ordersSparkline = [18, 24, 21, 30, 27, 34, 31, 38, 35, 42, 39, 47];
export const gmvSparkline = [220, 260, 240, 310, 290, 355, 330, 402, 380, 441, 420, 486];
export const deliverySparkline = [31, 29, 30, 28, 27, 28, 26, 25, 26, 24, 25, 24];
export const cancelSparkline = [5, 6, 5, 4, 5, 4, 4, 3, 4, 3, 3, 2];

export const gmv30Days = [
  312, 298, 341, 366, 329, 384, 402, 371, 355, 398,
  421, 407, 388, 432, 456, 441, 419, 468, 482, 459,
  437, 491, 506, 488, 512, 534, 519, 547, 563, 586,
];

export const revenueSplit = [
  { label: 'Food', value: 2140000, token: 'food' },
  { label: 'Grocery', value: 1290000, token: 'grocery' },
  { label: 'Parcel', value: 860000, token: 'parcel' },
];

export const moneySplit = [
  { label: 'Vendor payouts', value: 3180000, token: 'food' },
  { label: 'Rider payouts', value: 742000, token: 'grocery' },
  { label: 'Platform commission', value: 628000, token: 'go' },
  { label: 'Delivery fees', value: 314000, token: 'parcel' },
];

export const returningCustomers = [42, 48, 51, 47, 56, 61, 58, 64];

export const topVendors = [
  { label: 'UrbanMart', value: 3120000, token: 'grocery' },
  { label: 'Chez Mado', value: 2140000, token: 'food' },
  { label: 'Pizza Palace', value: 1830000, token: 'food' },
  { label: 'Buea Express', value: 1460000, token: 'parcel' },
  { label: 'GreenBowl', value: 1290000, token: 'food' },
];

export const deliveryByZone = [
  { label: 'Mile 16', value: 22 },
  { label: 'Molyko', value: 24 },
  { label: 'Bonduma', value: 27 },
  { label: 'Great Soppo', value: 33 },
  { label: 'Muea', value: 38 },
];

export const cancellationReasons = [
  { label: 'Vendor out of stock', value: 34, token: 'stop' },
  { label: 'Customer changed mind', value: 27, token: 'watch' },
  { label: 'No rider available', value: 19, token: 'stop' },
  { label: 'Address unreachable', value: 12, token: 'watch' },
  { label: 'Payment failed', value: 8, token: 'calm' },
];

export const ratingDistribution = [
  { label: '5 star', value: 612, token: 'go' },
  { label: '4 star', value: 284, token: 'go' },
  { label: '3 star', value: 96, token: 'watch' },
  { label: '2 star', value: 41, token: 'stop' },
  { label: '1 star', value: 23, token: 'stop' },
];

export const openComplaints = [
  { label: 'Late delivery', value: 14, token: 'stop' },
  { label: 'Wrong item', value: 9, token: 'watch' },
  { label: 'Rider conduct', value: 4, token: 'stop' },
  { label: 'Damaged packaging', value: 3, token: 'watch' },
];

/* Disputes — one of each status, plus a high-priority open one. */
export const disputes: Dispute[] = [
  {
    id: 'D-01', ticket: 'TCK-4471', subject: 'Order arrived cold',
    category: 'Food quality', status: 'open', priority: 'high',
    customer: 'Anna Mbella', orderId: 'F-2827', openedAgo: '2 hr ago',
    resolution: null,
    messages: [
      {
        id: 'm1', author: 'Anna Mbella',
        body: 'The pizza was cold and the wings were missing.',
        sentAt: '2 hr ago',
      },
      {
        id: 'm2', author: 'Support',
        body: 'Thank you for reporting this. We are checking with Pizza Palace.',
        sentAt: '1 hr ago',
      },
    ],
  },
  {
    id: 'D-02', ticket: 'TCK-4468', subject: 'Rider never arrived',
    category: 'Delivery', status: 'open', priority: 'normal',
    customer: 'Marc Etoa', orderId: 'S-1179', openedAgo: '5 hr ago',
    resolution: null,
    messages: [
      {
        id: 'm3', author: 'Marc Etoa',
        body: 'Waited an hour and nobody came. I cancelled in the end.',
        sentAt: '5 hr ago',
      },
    ],
  },
  {
    id: 'D-03', ticket: 'TCK-4455', subject: 'Charged twice for one order',
    category: 'Payment', status: 'resolved', priority: 'high',
    customer: 'Peter Samu', orderId: 'P-0769', openedAgo: '2 d ago',
    resolution: 'Duplicate charge refunded to MTN MoMo.',
    messages: [
      {
        id: 'm4', author: 'Peter Samu',
        body: 'My account shows two charges of FCFA 3 200.',
        sentAt: '2 d ago',
      },
    ],
  },
  {
    id: 'D-04', ticket: 'TCK-4450', subject: 'Wants refund for a delivered order',
    category: 'Refund', status: 'rejected', priority: 'low',
    customer: 'Clarisse Eto', orderId: 'F-2830', openedAgo: '3 d ago',
    resolution: null,
    messages: [
      {
        id: 'm5', author: 'Clarisse Eto',
        body: 'I changed my mind after it arrived.',
        sentAt: '3 d ago',
      },
    ],
  },
];

/* Menu approvals — a price rise, a price cut, a new item, and one of each
   settled status so every state is reachable. */
export const menuApprovals: MenuApproval[] = [
  {
    id: 'A-01', vendor: 'Chez Mado', itemName: 'Ndolé with plantain',
    category: 'Main dishes', changeType: 'price update',
    currentPrice: 3500, requestedPrice: 4200, status: 'pending',
    submittedAgo: '3 hr ago',
    reason: 'Cost of ingredients has risen this month.',
    adminNotes: null,
  },
  {
    id: 'A-02', vendor: 'UrbanMart', itemName: 'Rice 5kg',
    category: 'Staples', changeType: 'price update',
    currentPrice: 6500, requestedPrice: 5900, status: 'pending',
    submittedAgo: '6 hr ago',
    reason: 'Passing on a supplier discount.',
    adminNotes: null,
  },
  {
    id: 'A-03', vendor: 'GreenBowl', itemName: 'Avocado smoothie',
    category: 'Drinks', changeType: 'new item',
    currentPrice: null, requestedPrice: 1800, status: 'pending',
    submittedAgo: '1 d ago',
    reason: 'Adding a seasonal drink for the dry season.',
    adminNotes: null,
  },
  {
    id: 'A-04', vendor: 'Pizza Palace', itemName: 'Large pepperoni',
    category: 'Pizza', changeType: 'price update',
    currentPrice: 7800, requestedPrice: 8500, status: 'approved',
    submittedAgo: '2 d ago',
    reason: 'Cheese cost increase.',
    adminNotes: 'Approved, in line with the market.',
  },
  {
    id: 'A-05', vendor: 'Mama Grill', itemName: 'Grilled tilapia',
    category: 'Grill', changeType: 'price update',
    currentPrice: 4000, requestedPrice: 9500, status: 'rejected',
    submittedAgo: '3 d ago',
    reason: 'Fish is scarce.',
    adminNotes: 'A 138% rise is too steep. Resubmit with a smaller change.',
  },
];

/* API keys — one active, one never used, one revoked. */
export const apiKeys: ApiKey[] = [
  {
    id: 'K-01', name: 'support-bot', prefix: 'rey_live_8fa2',
    scopes: ['orders:read', 'users:read'],
    lastUsed: '2026-08-22', revoked: false,
  },
  {
    id: 'K-02', name: 'analytics-export', prefix: 'rey_live_31cd',
    scopes: ['analytics:read', 'orders:read'],
    lastUsed: null, revoked: false,
  },
  {
    id: 'K-03', name: 'old-dashboard', prefix: 'rey_live_0b47',
    scopes: ['orders:read'],
    lastUsed: '2026-06-02', revoked: true,
  },
];

export const API_KEY_SCOPES = [
  'orders:read', 'users:read', 'vendors:read', 'riders:read',
  'broadcast:write', 'analytics:read',
];

export const adminTeam = [
  { id: 'A-1', name: 'Adrian Nkeng', role: 'Platform admin', zone: 'Buea', active: true },
  { id: 'A-2', name: 'Estelle Ndam', role: 'Operations', zone: 'Buea', active: true },
  { id: 'A-3', name: 'Roland Che', role: 'Finance', zone: 'Douala', active: true },
  { id: 'A-4', name: 'Mirabel Sona', role: 'Support', zone: 'Buea', active: false },
];
