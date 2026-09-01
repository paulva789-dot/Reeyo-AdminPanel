// The distance-band fee engine — specification §6.
//
// This replaces the long-distance model. Instead of one rate for "far", the
// distance between pickup and drop-off decides which band applies, and beyond
// the last band a per-kilometre rate is added on top of it.

import type { Vertical } from './types';

export const BAND_COUNT = 5;

/** Band n covers (n-1) to n kilometres. */
export interface FeeBand {
  /** 1–5. */
  band: number;
  amount: number;
}

export interface FeeRuleSet {
  id: string;
  /** null means the rule applies everywhere it is not overridden. */
  zone: string | null;
  /** null means every service. */
  service: Vertical | null;
  bands: FeeBand[];
  /** Added per kilometre past the last band. */
  perKmBeyond: number;
  activeFrom: string | null;
  activeTo: string | null;
  active: boolean;
}

/**
 * Which band a distance falls in.
 *
 * §6.2 fixes the boundaries as inclusive at the lower end and exclusive at the
 * upper, so 2.0 km is band 3 and there is no gap or overlap. Note that this
 * makes exactly 2.0 behave differently from 1.999, which is the point: without
 * a stated rule the two ends of a boundary get decided by whoever wrote the
 * comparison, and they disagree.
 */
export function bandFor(km: number): number {
  if (km <= 0) return 1;
  return Math.min(Math.floor(km) + 1, BAND_COUNT);
}

/** True once the distance is past the banded range and the per-km rate applies. */
export function isOverflow(km: number): boolean {
  return km >= BAND_COUNT;
}

/** The fee for a distance under one rule set. */
export function feeFor(km: number, rules: FeeRuleSet): number {
  const top = rules.bands[rules.bands.length - 1]?.amount ?? 0;
  if (isOverflow(km)) {
    return top + Math.round((km - BAND_COUNT) * rules.perKmBeyond);
  }
  const band = rules.bands.find((b) => b.band === bandFor(km));
  return band?.amount ?? top;
}

/**
 * The rule set that applies to a delivery.
 *
 * Most specific wins: a rule naming both this zone and this service beats one
 * naming only the zone, which beats the global default.
 */
export function ruleFor(
  rules: FeeRuleSet[],
  zone: string,
  service: Vertical,
): FeeRuleSet | null {
  const active = rules.filter((r) => r.active);
  const score = (r: FeeRuleSet) => (r.zone === zone ? 2 : 0) + (r.service === service ? 1 : 0);

  const candidates = active.filter(
    (r) => (r.zone === null || r.zone === zone) && (r.service === null || r.service === service),
  );
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => score(b) - score(a))[0];
}

export function describeBand(band: number): string {
  return band >= BAND_COUNT ? `${band - 1} – ${band} km` : `${band - 1} – ${band} km`;
}

/** The rule sets the console starts with. */
export const feeRuleSets: FeeRuleSet[] = [
  {
    id: 'FR-01', zone: null, service: null,
    bands: [
      { band: 1, amount: 500 },
      { band: 2, amount: 700 },
      { band: 3, amount: 900 },
      { band: 4, amount: 1100 },
      { band: 5, amount: 1300 },
    ],
    perKmBeyond: 250, activeFrom: null, activeTo: null, active: true,
  },
  {
    // A dense city zone prices lower: the rider covers the distance faster.
    id: 'FR-02', zone: 'Akwa', service: null,
    bands: [
      { band: 1, amount: 400 },
      { band: 2, amount: 600 },
      { band: 3, amount: 800 },
      { band: 4, amount: 1000 },
      { band: 5, amount: 1200 },
    ],
    perKmBeyond: 200, activeFrom: null, activeTo: null, active: true,
  },
  {
    // A parcel over the same distance costs more: it is the whole job, not an
    // add-on to a basket the vendor is already being paid for.
    id: 'FR-03', zone: null, service: 'parcel',
    bands: [
      { band: 1, amount: 700 },
      { band: 2, amount: 950 },
      { band: 3, amount: 1200 },
      { band: 4, amount: 1450 },
      { band: 5, amount: 1700 },
    ],
    perKmBeyond: 300, activeFrom: null, activeTo: null, active: true,
  },
];
