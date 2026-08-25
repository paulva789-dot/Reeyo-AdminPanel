// Live rider positions from /riders/live-locations.
//
// This is the one capability the rebuild dropped that the old admin panel had
// working against the real API. Its map was decorative here — a seeded SVG —
// while the previous panel was polling real coordinates the whole time.

import { useState, useEffect, useCallback, useRef } from 'react';
import { platform } from '../services/platformResources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';
import type { RiderLocation } from '../data/types';

/** The old panel polled every 12s. Riders on a moto do not move usefully faster. */
const POLL_MS = 12000;

export interface RiderLocationsState {
  riders: RiderLocation[];
  loading: boolean;
  error: string | null;
  /** True in sample mode: nothing was requested. */
  sample: boolean;
  /** When the last successful poll landed, so the screen can say how fresh it is. */
  lastUpdated: Date | null;
  /** False while the tab is hidden and polling is suspended. */
  polling: boolean;
  refresh: () => void;
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'Live rider locations are not available on the backend.';
    return err.message;
  }
  return 'Could not load rider locations.';
}

export function useRiderLocations(country?: string): RiderLocationsState {
  const { mode, isAuthenticated } = useAuth();
  const isLive = mode === 'live';

  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [polling, setPolling] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // A background tab does not need rider positions, and polling one for hours
  // is a request every twelve seconds that nobody will ever look at.
  useEffect(() => {
    const onVisibility = () => {
      const visible = !document.hidden;
      setPolling(visible);
      if (visible) refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh]);

  const first = useRef(true);

  useEffect(() => {
    if (!isAuthenticated || !isLive || !polling) return;
    let cancelled = false;

    const poll = (initial: boolean) => {
      if (initial) setLoading(true);
      platform.riderLocations(country)
        .then((rows) => {
          if (cancelled) return;
          setRiders(rows);
          setLastUpdated(new Date());
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          // A failed poll leaves the last known positions on the map rather
          // than blanking it — stale and labelled beats empty.
          setError(describe(err));
          setLoading(false);
        });
    };

    poll(first.current);
    first.current = false;
    const timer = window.setInterval(() => poll(false), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, isLive, polling, country, tick]);

  return {
    riders, loading, error, sample: !isLive, lastUpdated, polling, refresh,
  };
}
