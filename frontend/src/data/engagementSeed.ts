// Sample engagement rows, so every panel is reachable without a live session.
// Figures here are plausible, not real — nothing in the console presents them
// as live (see the `sample` flag on each collection).

import type {
  EngagementBanner, Popup, SpinWheel, LoyaltyRule, LoyaltyReward,
  PreferenceTag, TrackingFact, SharedCart,
} from './types';

export const banners: EngagementBanner[] = [
  {
    id: 'EB-01', title: 'Free delivery in Molyko this weekend',
    imageUrl: null, destination: '/offers/molyko-weekend',
    isActive: true, taps: 4820,
  },
  {
    id: 'EB-02', title: 'Groceries before 9am',
    imageUrl: null, destination: '/grocery',
    isActive: true, taps: 2140,
  },
  {
    id: 'EB-03', title: 'Send a parcel across Douala',
    imageUrl: null, destination: '/parcel',
    isActive: true, taps: 1655,
  },
  {
    id: 'EB-04', title: 'Ramadan iftar menus',
    imageUrl: null, destination: '/collections/iftar',
    isActive: false, taps: 9310,
  },
];

export const popups: Popup[] = [
  {
    id: 'PU-01', title: 'Your first order is on us',
    body: 'New here? Use WELCOME to take FCFA 1 000 off your first delivery.',
    imageUrl: null, isActive: true, impressions: 18400, clicks: 2260,
  },
  {
    id: 'PU-02', title: 'Rate your last delivery',
    body: 'Two taps, and it helps the next customer pick well.',
    imageUrl: null, isActive: true, impressions: 9120, clicks: 3870,
  },
  {
    id: 'PU-03', title: 'We deliver in Bamenda now',
    body: 'Commercial Avenue and around, every day until 10pm.',
    imageUrl: null, isActive: false, impressions: 5210, clicks: 640,
  },
];

export const spinWheels: SpinWheel[] = [
  {
    id: 'SW-01', name: 'Weekend wheel', isActive: true,
    segments: [
      { id: 'SG-1', label: 'Free delivery', weight: 30, rewardType: 'DELIVERY' },
      { id: 'SG-2', label: 'FCFA 500 off', weight: 25, rewardType: 'DISCOUNT' },
      { id: 'SG-3', label: '100 points', weight: 25, rewardType: 'POINTS' },
      { id: 'SG-4', label: 'Try again', weight: 15, rewardType: 'NONE' },
      { id: 'SG-5', label: 'FCFA 2 000 off', weight: 5, rewardType: 'DISCOUNT' },
    ],
  },
  {
    id: 'SW-02', name: 'New customer wheel', isActive: false,
    segments: [
      { id: 'SG-6', label: 'Free delivery', weight: 50, rewardType: 'DELIVERY' },
      { id: 'SG-7', label: '200 points', weight: 50, rewardType: 'POINTS' },
    ],
  },
];

export const loyaltyRules: LoyaltyRule[] = [
  { id: 'LR-01', name: 'Points on every order', pointsPerOrder: 10, isActive: true },
  { id: 'LR-02', name: 'Double points on groceries', pointsPerOrder: 20, isActive: true },
  { id: 'LR-03', name: 'Triple points, launch week', pointsPerOrder: 30, isActive: false },
];

export const loyaltyRewards: LoyaltyReward[] = [
  { id: 'LW-01', name: 'Free delivery', pointsCost: 200, imageUrl: null, isActive: true },
  { id: 'LW-02', name: 'FCFA 1 000 off', pointsCost: 500, imageUrl: null, isActive: true },
  { id: 'LW-03', name: 'FCFA 3 000 off', pointsCost: 1400, imageUrl: null, isActive: true },
  { id: 'LW-04', name: 'reeyo tote bag', pointsCost: 2500, imageUrl: null, isActive: false },
];

export const preferenceTags: PreferenceTag[] = [
  { tag: 'spicy', usageCount: 3120 },
  { tag: 'vegetarian', usageCount: 1840 },
  { tag: 'halal', usageCount: 1610 },
  { tag: 'no-onion', usageCount: 720 },
  { tag: 'extra-plantain', usageCount: 640 },
  { tag: 'less-oil', usageCount: 410 },
];

export const trackingFacts: TrackingFact[] = [
  { id: 'TF-01', text: 'Ndolé takes about 4 hours to cook properly.', isActive: true },
  { id: 'TF-02', text: 'Your rider knows every shortcut in Molyko.', isActive: true },
  { id: 'TF-03', text: 'Cameroon grows some of the best cocoa in the world.', isActive: true },
  { id: 'TF-04', text: 'Puff-puff is best eaten within ten minutes.', isActive: false },
];

export const sharedCarts: SharedCart[] = [
  { id: 'SC-01', owner: 'Arlette Ngu', participants: 4, total: 18400, createdAgo: '22 min ago' },
  { id: 'SC-02', owner: 'Blaise Toko', participants: 3, total: 11250, createdAgo: '1 hr ago' },
  { id: 'SC-03', owner: 'Clarisse Mbah', participants: 6, total: 32900, createdAgo: '3 hr ago' },
];
