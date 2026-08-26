// The engagement suite: banners, popups, spin wheels, loyalty, preference
// tags, tracking facts and shared carts.
//
// Reads are open to any admin; every write is SuperAdmin-only, which the panels
// gate rather than letting the request 403 in silence.

import { useState, useEffect, useCallback } from 'react';
import { platform } from '../services/platformResources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';
import {
  banners as seedBanners, popups as seedPopups, spinWheels as seedWheels,
  loyaltyRules as seedRules, loyaltyRewards as seedRewards,
  preferenceTags as seedTags, trackingFacts as seedFacts,
  sharedCarts as seedCarts,
} from '../data/engagementSeed';
import type {
  EngagementBanner, Popup, SpinWheel, LoyaltyRule, LoyaltyReward,
  PreferenceTag, TrackingFact, SharedCart,
} from '../data/types';

/** One collection, with everything a panel needs to be honest about it. */
export interface Collection<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
  /** True when these are seed rows rather than anything from the API. */
  sample: boolean;
}

function seeded<T>(rows: T[]): Collection<T> {
  return { rows, loading: false, error: null, sample: true };
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'This is not available on the backend.';
    if (err.status === 403) return 'Your account is not allowed to see this.';
    return err.message;
  }
  return 'Something went wrong loading this.';
}

export interface EngagementState {
  banners: Collection<EngagementBanner>;
  popups: Collection<Popup>;
  spinWheels: Collection<SpinWheel>;
  loyaltyRules: Collection<LoyaltyRule>;
  loyaltyRewards: Collection<LoyaltyReward>;
  preferenceTags: Collection<PreferenceTag>;
  trackingFacts: Collection<TrackingFact>;
  sharedCarts: Collection<SharedCart>;

  createBanner: (body: { title: string; destination: string; imageUrl: string | null }) => void;
  updateBanner: (id: string, patch: Partial<EngagementBanner>) => void;
  deleteBanner: (id: string) => void;

  createPopup: (body: { title: string; body: string; imageUrl: string | null }) => void;
  updatePopup: (id: string, patch: Partial<Popup>) => void;
  deletePopup: (id: string) => void;

  toggleSpinWheel: (id: string, isActive: boolean) => void;
  createSpinWheel: (name: string) => void;
  deleteSpinWheel: (id: string) => void;
  addSegment: (wheelId: string, segment: SegmentDraft) => void;
  deleteSegment: (wheelId: string, segmentId: string) => void;

  createLoyaltyRule: (name: string, pointsPerOrder: number) => void;
  deleteLoyaltyRule: (id: string) => void;
  createLoyaltyReward: (body: { name: string; pointsCost: number }) => void;
  updateLoyaltyReward: (id: string, patch: Partial<LoyaltyReward>) => void;
  deleteLoyaltyReward: (id: string) => void;

  createPreferenceTag: (tag: string) => void;
  deletePreferenceTag: (tag: string) => void;

  createTrackingFact: (text: string) => void;
  updateTrackingFact: (id: string, patch: { text?: string; isActive?: boolean }) => void;
  deleteTrackingFact: (id: string) => void;

  reload: () => void;
}

/** A new slice, before the platform gives it an id. */
export interface SegmentDraft {
  label: string;
  weight: number;
  rewardType: string;
}

/** Which collections a page needs. Loading all eight for one tab is eight requests. */
export type EngagementKey =
  | 'banners' | 'popups' | 'spinWheels' | 'loyaltyRules' | 'loyaltyRewards'
  | 'preferenceTags' | 'trackingFacts' | 'sharedCarts';

export function useEngagement(want: EngagementKey[]): EngagementState {
  const { mode, isAuthenticated } = useAuth();
  const { pushToast } = useAppState();
  const isLive = mode === 'live';

  const [banners, setBanners] = useState<Collection<EngagementBanner>>(seeded(seedBanners));
  const [popups, setPopups] = useState<Collection<Popup>>(seeded(seedPopups));
  const [spinWheels, setSpinWheels] = useState<Collection<SpinWheel>>(seeded(seedWheels));
  const [loyaltyRules, setLoyaltyRules] = useState<Collection<LoyaltyRule>>(seeded(seedRules));
  const [loyaltyRewards, setLoyaltyRewards] =
    useState<Collection<LoyaltyReward>>(seeded(seedRewards));
  const [preferenceTags, setPreferenceTags] =
    useState<Collection<PreferenceTag>>(seeded(seedTags));
  const [trackingFacts, setTrackingFacts] =
    useState<Collection<TrackingFact>>(seeded(seedFacts));
  const [sharedCarts, setSharedCarts] = useState<Collection<SharedCart>>(seeded(seedCarts));
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // The array identity changes every render, so depend on its contents.
  const keys = want.join(',');

  useEffect(() => {
    if (!isAuthenticated || !isLive) return;
    let cancelled = false;
    const asked = new Set(keys.split(','));

    const load = <T,>(
      key: EngagementKey,
      call: () => Promise<T[]>,
      set: React.Dispatch<React.SetStateAction<Collection<T>>>,
      seed: T[],
    ) => {
      if (!asked.has(key)) return;
      set((prev) => ({ ...prev, loading: true, error: null }));
      call()
        .then((rows) => {
          if (!cancelled) set({ rows, loading: false, error: null, sample: false });
        })
        .catch((err) => {
          // Seed rows stay visible so the panel still reads, but sample stays
          // true so nothing on screen claims to be live.
          if (!cancelled) {
            set({ rows: seed, loading: false, error: describe(err), sample: true });
          }
        });
    };

    load('banners', () => platform.banners(), setBanners, seedBanners);
    load('popups', () => platform.popups(), setPopups, seedPopups);
    load('spinWheels', () => platform.spinWheels(), setSpinWheels, seedWheels);
    load('loyaltyRules', () => platform.loyaltyRules(), setLoyaltyRules, seedRules);
    load('loyaltyRewards', () => platform.loyaltyRewards(), setLoyaltyRewards, seedRewards);
    load('preferenceTags', () => platform.preferenceTags(), setPreferenceTags, seedTags);
    load('trackingFacts', () => platform.trackingFacts(), setTrackingFacts, seedFacts);
    load('sharedCarts', () => platform.sharedCarts(), setSharedCarts, seedCarts);

    return () => { cancelled = true; };
  }, [isAuthenticated, isLive, keys, reloadKey]);

  /** Sends a write, reporting a failure rather than leaving the optimism standing. */
  const write = useCallback((label: string, call: () => Promise<unknown>) => {
    if (!isLive) return;
    call()
      .then(() => reload())
      .catch((err) => {
        pushToast(`${label} failed — ${describe(err)}`);
        reload();
      });
  }, [isLive, reload, pushToast]);

  const createBanner = useCallback((
    body: { title: string; destination: string; imageUrl: string | null },
  ) => {
    setBanners((prev) => ({
      ...prev,
      rows: [...prev.rows, {
        id: `new-${Date.now()}`, ...body, isActive: true, taps: 0,
      }],
    }));
    pushToast(`${body.title} created`);
    write('Creating the banner', () => platform.createBanner({
      title: body.title,
      destination: body.destination,
      imageUrl: body.imageUrl ?? undefined,
      isActive: true,
    }));
  }, [write, pushToast]);

  const updateBanner = useCallback((id: string, patch: Partial<EngagementBanner>) => {
    setBanners((prev) => ({
      ...prev,
      rows: prev.rows.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
    write('Updating the banner', () => platform.updateBanner(id, patch));
  }, [write]);

  const deleteBanner = useCallback((id: string) => {
    setBanners((prev) => ({ ...prev, rows: prev.rows.filter((b) => b.id !== id) }));
    pushToast('Banner deleted');
    write('Deleting the banner', () => platform.deleteBanner(id));
  }, [write, pushToast]);

  const createPopup = useCallback((
    body: { title: string; body: string; imageUrl: string | null },
  ) => {
    setPopups((prev) => ({
      ...prev,
      rows: [...prev.rows, {
        id: `new-${Date.now()}`, ...body, isActive: true, impressions: 0, clicks: 0,
      }],
    }));
    pushToast(`${body.title} created`);
    write('Creating the popup', () => platform.createPopup({
      title: body.title,
      body: body.body,
      imageUrl: body.imageUrl ?? undefined,
      isActive: true,
    }));
  }, [write, pushToast]);

  const updatePopup = useCallback((id: string, patch: Partial<Popup>) => {
    setPopups((prev) => ({
      ...prev,
      rows: prev.rows.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    write('Updating the popup', () => platform.updatePopup(id, patch));
  }, [write]);

  const deletePopup = useCallback((id: string) => {
    setPopups((prev) => ({ ...prev, rows: prev.rows.filter((p) => p.id !== id) }));
    pushToast('Popup deleted');
    write('Deleting the popup', () => platform.deletePopup(id));
  }, [write, pushToast]);

  const toggleSpinWheel = useCallback((id: string, isActive: boolean) => {
    setSpinWheels((prev) => ({
      ...prev,
      rows: prev.rows.map((w) => (w.id === id ? { ...w, isActive } : w)),
    }));
    write('Updating the wheel', () => platform.updateSpinWheel(id, { isActive }));
  }, [write]);


  /* ---- Spin wheels ------------------------------------------------------ */

  const createSpinWheel = useCallback((name: string) => {
    setSpinWheels((prev) => ({
      ...prev,
      rows: [...prev.rows, {
        id: `new-${Date.now()}`, name, isActive: false, segments: [],
      }],
    }));
    pushToast(`${name} created`);
    write('Creating the wheel', () => platform.createSpinWheel(name));
  }, [write, pushToast]);

  const deleteSpinWheel = useCallback((id: string) => {
    const target = spinWheels.rows.find((w) => w.id === id);
    setSpinWheels((prev) => ({ ...prev, rows: prev.rows.filter((w) => w.id !== id) }));
    pushToast(target ? `${target.name} deleted` : 'Wheel deleted');
    write('Deleting the wheel', () => platform.deleteSpinWheel(id));
  }, [write, spinWheels.rows, pushToast]);

  const addSegment = useCallback((wheelId: string, segment: SegmentDraft) => {
    setSpinWheels((prev) => ({
      ...prev,
      rows: prev.rows.map((w) => (w.id === wheelId
        ? { ...w, segments: [...w.segments, { id: `new-${Date.now()}`, ...segment }] }
        : w)),
    }));
    pushToast(`${segment.label} added`);
    write('Adding the slice', () => platform.addSpinWheelSegment(wheelId, segment));
  }, [write, pushToast]);

  const deleteSegment = useCallback((wheelId: string, segmentId: string) => {
    setSpinWheels((prev) => ({
      ...prev,
      rows: prev.rows.map((w) => (w.id === wheelId
        ? { ...w, segments: w.segments.filter((sg) => sg.id !== segmentId) }
        : w)),
    }));
    pushToast('Slice removed');
    write('Removing the slice', () => platform.deleteSpinWheelSegment(wheelId, segmentId));
  }, [write, pushToast]);

  /* ---- Loyalty ---------------------------------------------------------- */

  const createLoyaltyRule = useCallback((name: string, pointsPerOrder: number) => {
    setLoyaltyRules((prev) => ({
      ...prev,
      rows: [...prev.rows, {
        id: `new-${Date.now()}`, name, pointsPerOrder, isActive: true,
      }],
    }));
    pushToast(`${name} created`);
    write('Creating the rule', () => platform.createLoyaltyRule(name, pointsPerOrder));
  }, [write, pushToast]);

  const deleteLoyaltyRule = useCallback((id: string) => {
    setLoyaltyRules((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.id !== id) }));
    pushToast('Rule deleted');
    write('Deleting the rule', () => platform.deleteLoyaltyRule(id));
  }, [write, pushToast]);

  const createLoyaltyReward = useCallback((body: { name: string; pointsCost: number }) => {
    setLoyaltyRewards((prev) => ({
      ...prev,
      rows: [...prev.rows, {
        id: `new-${Date.now()}`, ...body, imageUrl: null, isActive: true,
      }],
    }));
    pushToast(`${body.name} created`);
    write('Creating the reward', () => platform.createLoyaltyReward(body));
  }, [write, pushToast]);

  const updateLoyaltyReward = useCallback((id: string, patch: Partial<LoyaltyReward>) => {
    setLoyaltyRewards((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    write('Updating the reward', () => platform.updateLoyaltyReward(id, patch));
  }, [write]);

  const deleteLoyaltyReward = useCallback((id: string) => {
    setLoyaltyRewards((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.id !== id) }));
    pushToast('Reward deleted');
    write('Deleting the reward', () => platform.deleteLoyaltyReward(id));
  }, [write, pushToast]);

  /* ---- Tags and facts --------------------------------------------------- */

  const createPreferenceTag = useCallback((tag: string) => {
    setPreferenceTags((prev) => ({
      ...prev,
      rows: [...prev.rows, { tag, usageCount: 0 }],
    }));
    pushToast(`${tag} added`);
    write('Adding the tag', () => platform.createPreferenceTag(tag));
  }, [write, pushToast]);

  const deletePreferenceTag = useCallback((tag: string) => {
    setPreferenceTags((prev) => ({ ...prev, rows: prev.rows.filter((t) => t.tag !== tag) }));
    pushToast(`${tag} removed`);
    write('Removing the tag', () => platform.deletePreferenceTag(tag));
  }, [write, pushToast]);

  const createTrackingFact = useCallback((text: string) => {
    setTrackingFacts((prev) => ({
      ...prev,
      rows: [...prev.rows, { id: `new-${Date.now()}`, text, isActive: true }],
    }));
    pushToast('Fact added');
    write('Adding the fact', () => platform.createTrackingFact(text));
  }, [write, pushToast]);

  const updateTrackingFact = useCallback((
    id: string, patch: { text?: string; isActive?: boolean },
  ) => {
    setTrackingFacts((prev) => ({
      ...prev,
      rows: prev.rows.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
    write('Updating the fact', () => platform.updateTrackingFact(id, patch));
  }, [write]);

  const deleteTrackingFact = useCallback((id: string) => {
    setTrackingFacts((prev) => ({ ...prev, rows: prev.rows.filter((f) => f.id !== id) }));
    pushToast('Fact removed');
    write('Removing the fact', () => platform.deleteTrackingFact(id));
  }, [write, pushToast]);

  return {
    banners, popups, spinWheels, loyaltyRules, loyaltyRewards,
    preferenceTags, trackingFacts, sharedCarts,
    createBanner, updateBanner, deleteBanner,
    createPopup, updatePopup, deletePopup,
    toggleSpinWheel, createSpinWheel, deleteSpinWheel, addSegment, deleteSegment,
    createLoyaltyRule, deleteLoyaltyRule,
    createLoyaltyReward, updateLoyaltyReward, deleteLoyaltyReward,
    createPreferenceTag, deletePreferenceTag,
    createTrackingFact, updateTrackingFact, deleteTrackingFact,
    reload,
  };
}
