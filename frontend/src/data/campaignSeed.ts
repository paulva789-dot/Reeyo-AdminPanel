// Sample campaigns, so every §7 surface is reachable without a live session.

import type {
  CampaignBanner, CampaignPopup, HorizontalAisle, SpinCampaign,
} from './campaignTypes';

export const campaignBanners: CampaignBanner[] = [
  {
    id: 'CB-01', title: 'Free delivery in Molyko this weekend', imageUrl: null,
    zones: ['Molyko'], destination: 'Chez Mado',
    startsOn: '2026-08-29', endsOn: '2026-09-07',
    position: 1, active: true, taps: 4820,
  },
  {
    id: 'CB-02', title: 'Groceries before 9am', imageUrl: null,
    zones: ['Molyko', 'Bonduma', 'Great Soppo'], destination: 'UrbanMart',
    startsOn: null, endsOn: null,
    position: 2, active: true, taps: 2140,
  },
  {
    id: 'CB-03', title: 'Send a parcel across Douala', imageUrl: null,
    zones: ['Akwa', 'Bonanjo', 'Deido', 'Makepe'], destination: 'Buea Express',
    startsOn: null, endsOn: null,
    position: 3, active: true, taps: 1655,
  },
  {
    id: 'CB-04', title: 'Bakery mornings in Akwa', imageUrl: null,
    zones: ['Akwa'], destination: 'Akwa Bakery',
    startsOn: '2026-07-01', endsOn: '2026-08-15',
    position: 4, active: false, taps: 9310,
  },
];

export const campaignPopups: CampaignPopup[] = [
  {
    id: 'CP-01', title: 'Your first order is on us',
    body: 'New here? Use WELCOME to take FCFA 1 000 off your first delivery.',
    imageUrl: null, ctaLabel: 'Order now', ctaDestination: '/home',
    zones: [], occurrence: 'once per user', frequencyCap: 1,
    startsOn: null, endsOn: null, active: true,
    impressions: 18_400, clicks: 2260,
  },
  {
    id: 'CP-02', title: 'Rate your last delivery',
    body: 'Two taps, and it helps the next customer pick well.',
    imageUrl: null, ctaLabel: 'Rate it', ctaDestination: '/orders/last',
    zones: [], occurrence: 'once per day', frequencyCap: 3,
    startsOn: null, endsOn: null, active: true,
    impressions: 9120, clicks: 3870,
  },
  {
    id: 'CP-03', title: 'We deliver in Bamenda now',
    body: 'Commercial Avenue and around, every day until 10pm.',
    imageUrl: null, ctaLabel: 'See vendors', ctaDestination: '/home',
    zones: ['Commercial Avenue', 'Nkwen'], occurrence: 'once per session',
    frequencyCap: 2, startsOn: '2026-08-01', endsOn: '2026-09-30', active: false,
    impressions: 5210, clicks: 640,
  },
];

export const horizontalAisles: HorizontalAisle[] = [
  {
    id: 'HA-01', name: 'Fastest near you', zones: ['Molyko', 'Bonduma'],
    contentType: 'Vendor', selection: ['GreenBowl', 'Chez Mado', 'Pizza Palace'],
    backgroundToken: 'go', badge: 'Under 25 min',
    position: 1, startsOn: null, endsOn: null, active: true,
  },
  {
    id: 'HA-02', name: 'Weekly shop essentials', zones: [],
    contentType: 'Item', selection: ['Rice 5kg', 'Palm oil 2L', 'Maize flour 10kg'],
    backgroundToken: 'grocery', badge: null,
    position: 2, startsOn: null, endsOn: null, active: true,
  },
  {
    id: 'HA-03', name: 'Douala favourites', zones: ['Akwa', 'Bonanjo', 'Makepe'],
    contentType: 'Vendor', selection: ['Akwa Bakery', 'UrbanMart'],
    backgroundToken: 'food', badge: 'Popular',
    position: 3, startsOn: null, endsOn: null, active: false,
  },
];

export const spinCampaigns: SpinCampaign[] = [
  {
    id: 'SC-01', name: 'Weekend wheel', zones: ['Molyko', 'Bonduma', 'Great Soppo'],
    startsOn: '2026-08-29', endsOn: '2026-09-30', active: true,
    segments: [
      { id: 'WS-1', label: 'Free delivery', prizeType: 'Free delivery', value: 0, colourToken: 'parcel', probability: 30 },
      { id: 'WS-2', label: 'FCFA 500 off', prizeType: 'Discount', value: 500, colourToken: 'food', probability: 25 },
      { id: 'WS-3', label: '100 points', prizeType: 'Wallet credit', value: 100, colourToken: 'grocery', probability: 25 },
      { id: 'WS-4', label: 'Try again', prizeType: 'No win', value: 0, colourToken: 'calm', probability: 15 },
      { id: 'WS-5', label: 'FCFA 2 000 off', prizeType: 'Discount', value: 2000, colourToken: 'watch', probability: 5 },
    ],
    maxSpinsPerUser: 3, maxSpinsPerDay: 1, totalPrizes: 500,
    eligibility: 'All customers', minimumOrders: 0,
    spins: 1840,
    winsBySegment: { 'WS-1': 548, 'WS-2': 461, 'WS-3': 452, 'WS-4': 287, 'WS-5': 92 },
    prizesRedeemed: 1203, cost: 486_500,
  },
  {
    id: 'SC-02', name: 'New customer wheel', zones: [],
    startsOn: null, endsOn: null, active: false,
    segments: [
      { id: 'WS-6', label: 'Free delivery', prizeType: 'Free delivery', value: 0, colourToken: 'parcel', probability: 50 },
      { id: 'WS-7', label: '200 points', prizeType: 'Wallet credit', value: 200, colourToken: 'grocery', probability: 50 },
    ],
    maxSpinsPerUser: 1, maxSpinsPerDay: 1, totalPrizes: 200,
    eligibility: 'New customers only', minimumOrders: 0,
    spins: 0, winsBySegment: {}, prizesRedeemed: 0, cost: 0,
  },
];
