// Detail views load when a drawer opens, not with the page. A customer's order
// history is worth a request when someone asks for it and worth nothing when
// they are scanning a table of two hundred rows.

import { useState, useEffect, useRef } from 'react';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';

export interface Detail<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
  /** True in sample mode: nothing was requested, so use whatever is derived. */
  sample: boolean;
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'The platform has nothing recorded here.';
    if (err.status === 403) return 'Your account is not allowed to see this.';
    return err.message;
  }
  return 'Something went wrong loading this.';
}

/**
 * @param key      Identifies what is being loaded. The request re-runs when it
 *                 changes; `null` means load nothing (the drawer is closed).
 * @param fetcher  Read through a ref, so an inline arrow in the caller does not
 *                 refetch on every render.
 */
export function useDetail<T>(key: string | null, fetcher: () => Promise<T>): Detail<T> {
  const { mode, isAuthenticated } = useAuth();
  const isLive = mode === 'live';

  const [state, setState] = useState<Detail<T>>({
    value: null, loading: false, error: null, sample: !isLive,
  });

  const call = useRef(fetcher);
  useEffect(() => { call.current = fetcher; }, [fetcher]);

  useEffect(() => {
    if (key === null) return;
    if (!isAuthenticated || !isLive) {
      return;
    }
    let cancelled = false;

    const run = () => {
      setState({ value: null, loading: true, error: null, sample: false });
      return call.current();
    };

    run()
      .then((value) => {
        if (!cancelled) setState({ value, loading: false, error: null, sample: false });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ value: null, loading: false, error: describe(err), sample: false });
        }
      });

    return () => { cancelled = true; };
  }, [key, isAuthenticated, isLive]);

  return state;
}
