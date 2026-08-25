// Sample delivery zones, so the map and the editor are reachable without a
// live session. The polygons are rough boxes around real town centres — enough
// to sit in the right place on the map, not survey data.

import type { DeliveryZone } from './types';

/** A box of roughly `size` degrees around a centre point, clockwise. */
function box(lat: number, lng: number, size: number): [number, number][] {
  const h = size / 2;
  return [
    [lat + h, lng - h],
    [lat + h, lng + h],
    [lat - h, lng + h],
    [lat - h, lng - h],
  ];
}

export const deliveryZones: DeliveryZone[] = [
  {
    id: 'DZ-01', name: 'Buea — Molyko', countryCode: 'CM',
    polygon: box(4.1560, 9.2870, 0.030),
    deliveryFeeOverride: null, isActive: true,
  },
  {
    id: 'DZ-02', name: 'Buea — Great Soppo', countryCode: 'CM',
    polygon: box(4.1490, 9.2380, 0.026),
    deliveryFeeOverride: 800, isActive: true,
  },
  {
    id: 'DZ-03', name: 'Douala — Akwa', countryCode: 'CM',
    polygon: box(4.0500, 9.7000, 0.034),
    deliveryFeeOverride: null, isActive: true,
  },
  {
    id: 'DZ-04', name: 'Douala — Bonabéri', countryCode: 'CM',
    polygon: box(4.0700, 9.6600, 0.032),
    deliveryFeeOverride: 1200, isActive: false,
  },
  {
    id: 'DZ-05', name: 'Yaoundé — Bastos', countryCode: 'CM',
    polygon: box(3.8900, 11.5100, 0.030),
    deliveryFeeOverride: null, isActive: true,
  },
  {
    id: 'DZ-06', name: 'Bamenda — Commercial Avenue', countryCode: 'CM',
    polygon: box(5.9600, 10.1460, 0.028),
    deliveryFeeOverride: null, isActive: true,
  },
];

/** Where the map opens when there is nothing to fit to — the middle of Cameroon. */
export const CAMEROON_CENTRE: [number, number] = [5.6, 12.4];
