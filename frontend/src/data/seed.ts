import type {
  Order, Vendor, Rider, Customer, Payment, PayoutRequest, Offer, Banner,
  MenuCategory, Announcement, SpinPrize, Team, FeeRule, RiderPosition, Zone,
  Dispute, MenuApproval, ApiKey,
} from './types';

export const ZONES: Zone[] = ['Molyko', 'Bonduma', 'Great Soppo', 'Mile 16', 'Muea'];

export const PAYMENT_METHODS = [
  'MTN Mobile Money', 'Orange Money', 'Cash on delivery', 'Card', 'Bank transfer',
];

/* Orders — 12, all three verticals, every live stage, one delayed, one cancelled. */
export const orders: Order[] = [
  {
    id: 'F-2841', vertical: 'food', customer: 'Anna Mbella', vendor: 'Chez Mado',
    rider: null, items: 'Ndolé with plantain · 2 × grilled fish', total: 8400,
    status: 'new', zone: 'Molyko', placedAgo: '2 min ago', eta: '32 min',
    payment: 'MTN MoMo',
  },
  {
    id: 'S-1192', vertical: 'grocery', customer: 'Marc Etoa', vendor: 'UrbanMart',
    rider: null, items: 'Rice 5kg · Palm oil · Tomatoes', total: 12600,
    status: 'new', zone: 'Bonduma', placedAgo: '4 min ago', eta: '40 min',
    payment: 'Orange Money',
  },
  {
    id: 'P-0774', vertical: 'parcel', customer: 'Peter Samu', vendor: 'Buea Express',
    rider: 'Sarah Ngo', items: 'Documents envelope · Molyko to Muea', total: 2500,
    status: 'accepted', zone: 'Muea', placedAgo: '7 min ago', eta: '25 min',
    payment: 'Cash',
  },
  {
    id: 'F-2839', vertical: 'food', customer: 'Clarisse Eto', vendor: 'Pizza Palace',
    rider: null, items: 'Large pepperoni · Garlic bread', total: 9800,
    status: 'accepted', zone: 'Great Soppo', placedAgo: '9 min ago', eta: '28 min',
    payment: 'Card',
  },
  {
    id: 'F-2836', vertical: 'food', customer: 'Anna Mbella', vendor: 'GreenBowl',
    rider: 'Eric Njume', items: 'Chicken salad bowl · Fresh juice', total: 6200,
    status: 'preparing', zone: 'Molyko', placedAgo: '12 min ago', eta: '18 min',
    payment: 'MTN MoMo',
  },
  {
    id: 'S-1188', vertical: 'grocery', customer: 'Sarah Ngo', vendor: 'Pharma Plus',
    rider: 'Divine Ako', items: 'Paracetamol · Vitamin C · Bandages', total: 4300,
    status: 'preparing', zone: 'Mile 16', placedAgo: '14 min ago', eta: '20 min',
    payment: 'Orange Money',
  },
  {
    id: 'F-2833', vertical: 'food', customer: 'Marc Etoa', vendor: 'Chez Mado',
    rider: 'Eric Njume', items: 'Poulet DG · 2 × soft drink', total: 11200,
    status: 'ready', zone: 'Bonduma', placedAgo: '19 min ago', eta: '12 min',
    payment: 'MTN MoMo',
  },
  {
    id: 'S-1184', vertical: 'grocery', customer: 'Peter Samu', vendor: 'UrbanMart',
    rider: 'Blaise Fon', items: 'Bread · Eggs · Milk · Sugar', total: 5900,
    status: 'ready', zone: 'Molyko', placedAgo: '21 min ago', eta: '9 min',
    payment: 'Cash',
  },
  {
    id: 'F-2830', vertical: 'food', customer: 'Clarisse Eto', vendor: 'GreenBowl',
    rider: 'Divine Ako', items: 'Veggie wrap · Smoothie', total: 5400,
    status: 'on the way', zone: 'Great Soppo', placedAgo: '26 min ago', eta: '6 min',
    payment: 'Card',
  },
  {
    id: 'P-0769', vertical: 'parcel', customer: 'Anna Mbella', vendor: 'Buea Express',
    rider: 'Sarah Ngo', items: 'Small package · Bonduma to Mile 16', total: 3200,
    status: 'delivered', zone: 'Mile 16', placedAgo: '48 min ago', eta: 'done',
    payment: 'MTN MoMo',
  },
  {
    id: 'F-2827', vertical: 'food', customer: 'Sarah Ngo', vendor: 'Pizza Palace',
    rider: 'Blaise Fon', items: 'Margherita · Wings', total: 8900,
    status: 'delayed', zone: 'Muea', placedAgo: '52 min ago', eta: 'late 14 min',
    payment: 'Orange Money',
  },
  {
    id: 'S-1179', vertical: 'grocery', customer: 'Marc Etoa', vendor: 'UrbanMart',
    rider: null, items: 'Detergent · Soap · Tissue', total: 4700,
    status: 'cancelled', zone: 'Bonduma', placedAgo: '1 hr ago', eta: 'done',
    payment: 'Cash',
  },
];

/* Vendors — 4 food, 3 grocery, 1 parcel. One suspended, one under review. */
export const vendors: Vendor[] = [
  {
    id: 'V-101', name: 'Chez Mado', vertical: 'food', category: 'Cameroonian',
    zone: 'Molyko', orders: 412, revenue: 2140000, rating: 4.8,
    prepMinutes: 18, status: 'active', joined: '2024-03-12',
  },
  {
    id: 'V-102', name: 'GreenBowl', vertical: 'food', category: 'Healthy',
    zone: 'Bonduma', orders: 287, revenue: 1290000, rating: 4.6,
    prepMinutes: 14, status: 'active', joined: '2024-06-02',
  },
  {
    id: 'V-103', name: 'Pizza Palace', vertical: 'food', category: 'Pizza',
    zone: 'Great Soppo', orders: 356, revenue: 1830000, rating: 4.3,
    prepMinutes: 22, status: 'active', joined: '2024-01-28',
  },
  {
    id: 'V-104', name: 'Mama Grill', vertical: 'food', category: 'Grill',
    zone: 'Muea', orders: 78, revenue: 340000, rating: 3.9,
    prepMinutes: 31, status: 'review', joined: '2025-11-19',
  },
  {
    id: 'V-201', name: 'UrbanMart', vertical: 'grocery', category: 'Supermarket',
    zone: 'Molyko', orders: 508, revenue: 3120000, rating: 4.7,
    prepMinutes: 25, status: 'active', joined: '2023-11-04',
  },
  {
    id: 'V-202', name: 'Pharma Plus', vertical: 'grocery', category: 'Pharmacy',
    zone: 'Mile 16', orders: 193, revenue: 870000, rating: 4.9,
    prepMinutes: 11, status: 'active', joined: '2024-08-21',
  },
  {
    id: 'V-203', name: 'Fresh Corner', vertical: 'grocery', category: 'Produce',
    zone: 'Bonduma', orders: 64, revenue: 210000, rating: 3.6,
    prepMinutes: 29, status: 'suspended', joined: '2025-02-14',
  },
  {
    id: 'V-301', name: 'Buea Express', vertical: 'parcel', category: 'Courier agent',
    zone: 'Molyko', orders: 631, revenue: 1460000, rating: 4.5,
    prepMinutes: 6, status: 'active', joined: '2023-09-30',
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
    id: 'R-01', name: 'Eric Njume', zone: 'Molyko', vehicle: 'Moto',
    trips: 345, rating: 4.8, owed: 96200, state: 'on a delivery', phone: '675 11 22 33',
  },
  {
    id: 'R-02', name: 'Sarah Ngo', zone: 'Muea', vehicle: 'Moto',
    trips: 289, rating: 4.6, owed: 74500, state: 'on a delivery', phone: '677 45 78 12',
  },
  {
    id: 'R-03', name: 'Divine Ako', zone: 'Great Soppo', vehicle: 'Moto',
    trips: 412, rating: 4.9, owed: 118300, state: 'on a delivery', phone: '699 03 56 41',
  },
  {
    id: 'R-04', name: 'Blaise Fon', zone: 'Bonduma', vehicle: 'Car',
    trips: 156, rating: 3.9, owed: 43800, state: 'running late', phone: '671 88 90 04',
  },
  {
    id: 'R-05', name: 'Nadine Bih', zone: 'Mile 16', vehicle: 'Moto',
    trips: 203, rating: 4.4, owed: 51900, state: 'idle', phone: '678 21 34 67',
  },
  {
    id: 'R-06', name: 'Joseph Tabi', zone: 'Molyko', vehicle: 'Bicycle',
    trips: 88, rating: 4.2, owed: 19400, state: 'idle', phone: '676 55 12 89',
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
    id: 'CU-01', name: 'Anna Mbella', zone: 'Molyko', orders: 63, spend: 412000,
    lastOrder: '2026-08-22', rating: 4.9, segment: 'loyal',
  },
  {
    id: 'CU-02', name: 'Marc Etoa', zone: 'Bonduma', orders: 41, spend: 268000,
    lastOrder: '2026-08-22', rating: 4.6, segment: 'loyal',
  },
  {
    id: 'CU-03', name: 'Peter Samu', zone: 'Molyko', orders: 18, spend: 96000,
    lastOrder: '2026-08-21', rating: 4.4, segment: 'active',
  },
  {
    id: 'CU-04', name: 'Sarah Ngo', zone: 'Mile 16', orders: 22, spend: 131000,
    lastOrder: '2026-08-20', rating: 4.7, segment: 'active',
  },
  {
    id: 'CU-05', name: 'Clarisse Eto', zone: 'Great Soppo', orders: 9, spend: 47000,
    lastOrder: '2026-08-22', rating: 4.5, segment: 'active',
  },
  {
    id: 'CU-06', name: 'Brenda Manga', zone: 'Muea', orders: 2, spend: 11400,
    lastOrder: '2026-08-19', rating: 4.0, segment: 'new',
  },
  {
    id: 'CU-07', name: 'Samuel Ndip', zone: 'Bonduma', orders: 27, spend: 154000,
    lastOrder: '2026-05-03', rating: 4.2, segment: 'lapsed',
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
    zone: 'Molyko', type: 'Percent off', value: '15%', payer: 'Split 50/50',
    uses: 342, spent: 214000, active: true, ends: '2026-09-15',
  },
  {
    id: 2, name: 'First grocery order', code: 'FRESH1000', vertical: 'Grocery',
    zone: 'All zones', type: 'Amount off', value: 'FCFA 1 000', payer: 'Platform',
    uses: 128, spent: 128000, active: true, ends: '2026-08-31',
  },
  {
    id: 3, name: 'Parcel weekend', code: 'SENDFREE', vertical: 'Parcel',
    zone: 'Bonduma', type: 'Free delivery', value: 'Delivery waived', payer: 'Vendor',
    uses: 76, spent: 60800, active: false, ends: '2026-08-10',
  },
];

export const banners: Banner[] = [
  {
    id: 1, name: 'Ndolé season at Chez Mado', vertical: 'Food', zone: 'All zones',
    destination: 'Vendor · Chez Mado', active: true, taps: 4820,
  },
  {
    id: 2, name: 'Stock up at UrbanMart', vertical: 'Grocery', zone: 'Molyko',
    destination: 'Vendor · UrbanMart', active: true, taps: 3140,
  },
  {
    id: 3, name: 'Send anything, same day', vertical: 'Parcel', zone: 'All zones',
    destination: 'Service · Parcel', active: false, taps: 1290,
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
    zone: 'Molyko', shift: '08:00 – 16:00', load: 72,
  },
  {
    id: 'T-2', name: 'Bonduma runners', lead: 'Blaise Fon', size: 6,
    zone: 'Bonduma', shift: '10:00 – 18:00', load: 48,
  },
  {
    id: 'T-3', name: 'Soppo evening', lead: 'Divine Ako', size: 5,
    zone: 'Great Soppo', shift: '14:00 – 22:00', load: 84,
  },
  {
    id: 'T-4', name: 'Mile 16 relay', lead: 'Nadine Bih', size: 4,
    zone: 'Mile 16', shift: '09:00 – 17:00', load: 31,
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

export const zoneStats = [
  { zone: 'Molyko' as Zone, riders: 8, activeOrders: 14, capacity: 72, avgMinutes: 24 },
  { zone: 'Bonduma' as Zone, riders: 6, activeOrders: 7, capacity: 48, avgMinutes: 27 },
  { zone: 'Great Soppo' as Zone, riders: 5, activeOrders: 11, capacity: 84, avgMinutes: 33 },
  { zone: 'Mile 16' as Zone, riders: 4, activeOrders: 3, capacity: 31, avgMinutes: 22 },
  { zone: 'Muea' as Zone, riders: 3, activeOrders: 5, capacity: 63, avgMinutes: 38 },
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
