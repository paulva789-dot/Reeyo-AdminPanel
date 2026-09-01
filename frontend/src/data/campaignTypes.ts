// Promotional surfaces — specification §7.
//
// Everything here is zone-aware. A campaign shown to the whole country when it
// was meant for one neighbourhood is worse than no campaign: it spends budget
// on people who cannot act on it, and teaches them to ignore the next one.

export type Occurrence =
  | 'app open' | 'once per session' | 'once per day' | 'once per user' | 'date window';

export const OCCURRENCES: Occurrence[] = [
  'app open', 'once per session', 'once per day', 'once per user', 'date window',
];

export interface CampaignBanner {
  id: string;
  title: string;
  imageUrl: string | null;
  /** Empty means every zone. */
  zones: string[];
  /** A vendor or item the banner opens. */
  destination: string;
  startsOn: string | null;
  endsOn: string | null;
  /** Order of appearance (§7.1). */
  position: number;
  active: boolean;
  taps: number;
}

export interface CampaignPopup {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaDestination: string;
  zones: string[];
  occurrence: Occurrence;
  /** No user sees it more than this many times (§7.2). */
  frequencyCap: number;
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
  impressions: number;
  clicks: number;
}

/** §7.3 — the Section feature, renamed and rebuilt. */
export interface HorizontalAisle {
  id: string;
  name: string;
  zones: string[];
  contentType: 'Vendor' | 'Item';
  /** Names of the vendors or items featured. */
  selection: string[];
  /** A design token name, so the row stays inside the palette. */
  backgroundToken: string;
  /** Optional badge overlay on each card. */
  badge: string | null;
  position: number;
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
}

export type PrizeType = 'Discount' | 'Free delivery' | 'Wallet credit' | 'Item' | 'No win';

export interface WheelSegment {
  id: string;
  label: string;
  prizeType: PrizeType;
  /** FCFA, or a percentage for a discount. Ignored for "No win". */
  value: number;
  /** A design token, so a wheel cannot introduce a colour off the palette. */
  colourToken: string;
  /** Percent. §7.4 validates these to total 100. */
  probability: number;
}

export type Eligibility = 'All customers' | 'New customers only' | 'Minimum order count';

export interface SpinCampaign {
  id: string;
  name: string;
  zones: string[];
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
  segments: WheelSegment[];
  maxSpinsPerUser: number;
  maxSpinsPerDay: number;
  totalPrizes: number;
  eligibility: Eligibility;
  minimumOrders: number;
  /** Reporting (§7.4). */
  spins: number;
  winsBySegment: Record<string, number>;
  prizesRedeemed: number;
  cost: number;
}

/** The tokens a campaign may paint with. Section 3.3: no fifth signal invented. */
export const CAMPAIGN_TOKENS = [
  'food', 'grocery', 'parcel', 'go', 'watch', 'stop', 'calm',
];

/** Probabilities have to total exactly 100 before a wheel can go live (§7.4). */
export function probabilityTotal(segments: WheelSegment[]): number {
  return Math.round(segments.reduce((sum, s) => sum + s.probability, 0) * 10) / 10;
}

/** How a zone list reads in a table. */
export function describeZones(zones: string[]): string {
  if (zones.length === 0) return 'Every zone';
  if (zones.length <= 2) return zones.join(', ');
  return `${zones.slice(0, 2).join(', ')} +${zones.length - 2}`;
}
