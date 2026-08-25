// Analytics is six independent endpoints, not one overview, so each loads on
// its own — one of them failing must not blank the other five.
//
// Nothing here is region-scoped: the API accepts no region parameter, so these
// figures always cover the whole platform. Pages that show them alongside the
// region filter have to say so.

import { useState, useEffect, useCallback } from 'react';
import { platform } from '../services/platformResources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';
import type {
  PlatformStats, RevenuePoint, RankedEntity, OrderStatusCount, LiveSnapshot,
} from '../data/types';

export interface Loadable<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
}

const IDLE: Loadable<never> = { value: null, loading: false, error: null };

export interface AnalyticsBundle {
  stats: Loadable<PlatformStats>;
  revenue: Loadable<RevenuePoint[]>;
  topVendors: Loadable<RankedEntity[]>;
  topRiders: Loadable<RankedEntity[]>;
  orderStatus: Loadable<OrderStatusCount[]>;
  live: Loadable<LiveSnapshot>;
  /** True in sample mode: nothing was requested, so every value stays null. */
  sample: boolean;
  reload: () => void;
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'This figure is not available on the backend.';
    return err.message;
  }
  return 'Something went wrong loading this.';
}

/**
 * @param want  Which endpoints this page actually needs. Overview wants only
 *              the live snapshot; asking for all six there would be six
 *              requests for one card.
 */
export function useAnalytics(want: (keyof AnalyticsBundle)[]): AnalyticsBundle {
  const { mode, isAuthenticated } = useAuth();
  const isLive = mode === 'live';

  const [stats, setStats] = useState<Loadable<PlatformStats>>(IDLE);
  const [revenue, setRevenue] = useState<Loadable<RevenuePoint[]>>(IDLE);
  const [topVendors, setTopVendors] = useState<Loadable<RankedEntity[]>>(IDLE);
  const [topRiders, setTopRiders] = useState<Loadable<RankedEntity[]>>(IDLE);
  const [orderStatus, setOrderStatus] = useState<Loadable<OrderStatusCount[]>>(IDLE);
  const [live, setLive] = useState<Loadable<LiveSnapshot>>(IDLE);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // The array identity changes every render, so depend on its contents.
  const keys = want.join(',');

  useEffect(() => {
    if (!isAuthenticated || !isLive) return;
    let cancelled = false;
    const asked = new Set(keys.split(','));

    const fetch = <T,>(
      key: string,
      call: () => Promise<T>,
      set: React.Dispatch<React.SetStateAction<Loadable<T>>>,
    ) => {
      if (!asked.has(key)) return;
      set({ value: null, loading: true, error: null });
      call()
        .then((value) => { if (!cancelled) set({ value, loading: false, error: null }); })
        .catch((err) => {
          if (!cancelled) set({ value: null, loading: false, error: describe(err) });
        });
    };

    fetch('stats', () => platform.platformStats(), setStats);
    fetch('revenue', () => platform.revenue(), setRevenue);
    fetch('topVendors', () => platform.topVendors(), setTopVendors);
    fetch('topRiders', () => platform.topRiders(), setTopRiders);
    fetch('orderStatus', () => platform.orderStatusBreakdown(), setOrderStatus);
    fetch('live', () => platform.liveSnapshot(), setLive);

    return () => { cancelled = true; };
  }, [isAuthenticated, isLive, keys, reloadKey]);

  return {
    stats, revenue, topVendors, topRiders, orderStatus, live,
    sample: !isLive,
    reload,
  };
}
