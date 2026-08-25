// Sample rows for the approval queues. Kept apart from seed.ts because these
// exist only to make the queues reachable without a live session.

import { regionOfZone, cityOfZone } from './geography';
import type { Region } from './geography';
import type { PendingVendor, PendingRider, RiderDocument } from './types';

function place(zone: string): { zone: string; city: string; region: Region } {
  const region = regionOfZone(zone);
  const city = cityOfZone(zone);
  if (!region || !city) throw new Error(`Unknown zone in approval seed: ${zone}`);
  return { zone, city, region };
}

function docs(
  overrides: Partial<Record<RiderDocument['type'], Partial<RiderDocument>>> = {},
): RiderDocument[] {
  const base: RiderDocument['type'][] = [
    'NATIONAL_ID', 'DRIVERS_LICENSE', 'VEHICLE_REGISTRATION', 'PROFILE_PHOTO', 'INSURANCE',
  ];
  return base.map((type) => ({
    type,
    status: 'pending',
    url: 'sample://document',
    reason: null,
    ...overrides[type],
  }));
}

export const pendingVendors: PendingVendor[] = [
  {
    id: 'PV-01', name: 'Mami Nkeng Kitchen', category: 'Cameroonian',
    ...place('Molyko'), owner: 'Grace Nkeng',
    phone: '677 30 14 92', email: 'grace@maminkeng.cm',
    submittedAgo: '4 hr ago', status: 'pending',
    commissionRate: null, featured: false,
  },
  {
    id: 'PV-02', name: 'Akwa Bakery', category: 'Bakery',
    ...place('Akwa'), owner: 'Ibrahim Njoya',
    phone: '699 71 40 05', email: 'contact@akwabakery.cm',
    submittedAgo: '1 d ago', status: 'pending',
    commissionRate: null, featured: false,
  },
  {
    id: 'PV-03', name: 'Bastos Juice Bar', category: 'Drinks',
    ...place('Bastos'), owner: 'Chantal Meka',
    phone: '675 22 88 31', email: 'hello@bastosjuice.cm',
    submittedAgo: '2 d ago', status: 'pending',
    commissionRate: null, featured: false,
  },
  {
    id: 'PV-04', name: 'Nkwen Corner Store', category: 'Provisions',
    ...place('Nkwen'), owner: 'Emmanuel Che',
    phone: '671 09 55 18', email: 'nkwencorner@mail.cm',
    submittedAgo: '5 d ago', status: 'rejected',
    commissionRate: null, featured: false,
  },
];

export const pendingRiders: PendingRider[] = [
  {
    id: 'PR-01', name: 'Yves Manga', phone: '678 44 02 17',
    email: 'yves.manga@mail.cm', vehicle: 'Moto', plate: 'CE 4471 AB',
    ...place('Deido'), submittedAgo: '3 hr ago', status: 'pending',
    documents: docs(),
  },
  {
    id: 'PR-02', name: 'Solange Fru', phone: '699 18 63 40',
    email: 'solange.fru@mail.cm', vehicle: 'Moto', plate: 'NW 0912 CD',
    ...place('Commercial Avenue'), submittedAgo: '9 hr ago', status: 'pending',
    // Part-reviewed: the licence is already approved, insurance was refused.
    documents: docs({
      DRIVERS_LICENSE: { status: 'approved' },
      INSURANCE: { status: 'rejected', reason: 'Policy expired in June.' },
    }),
  },
  {
    id: 'PR-03', name: 'Patrick Ebong', phone: '676 85 27 09',
    email: 'p.ebong@mail.cm', vehicle: 'Bicycle', plate: '—',
    ...place('Great Soppo'), submittedAgo: '2 d ago', status: 'pending',
    // Nothing uploaded for insurance — the review has to show that gap.
    documents: docs({ INSURANCE: { url: null } }),
  },
  {
    id: 'PR-04', name: 'Reine Atangana', phone: '677 61 33 24',
    email: 'reine.a@mail.cm', vehicle: 'Car', plate: 'CE 8830 XY',
    ...place('Mvan'), submittedAgo: '6 d ago', status: 'approved',
    documents: docs({
      NATIONAL_ID: { status: 'approved' },
      DRIVERS_LICENSE: { status: 'approved' },
      VEHICLE_REGISTRATION: { status: 'approved' },
      PROFILE_PHOTO: { status: 'approved' },
      INSURANCE: { status: 'approved' },
    }),
  },
];
