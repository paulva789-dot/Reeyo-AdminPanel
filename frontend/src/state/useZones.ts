// Delivery zones from /logistics/zones. They live in their own hook rather
// than AppState because only one tab uses them, and a polygon list is heavy to
// carry on every page.

import { useState, useEffect, useCallback } from 'react';
import { platform } from '../services/platformResources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';
import { deliveryZones as seedZones } from '../data/zoneSeed';
import type { DeliveryZone } from '../data/types';

export interface ZonesState {
  zones: DeliveryZone[];
  loading: boolean;
  error: string | null;
  /** True when these are seed polygons rather than anything from the API. */
  sample: boolean;
  create: (zone: Omit<DeliveryZone, 'id'>) => void;
  update: (id: string, patch: Partial<Omit<DeliveryZone, 'id'>>) => void;
  remove: (id: string) => void;
  reload: () => void;
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'Delivery zones are not available on the backend.';
    return err.message;
  }
  return 'Something went wrong.';
}

export function useZones(): ZonesState {
  const { mode, isAuthenticated } = useAuth();
  const { pushToast } = useAppState();
  const isLive = mode === 'live';

  const [zones, setZones] = useState<DeliveryZone[]>(seedZones);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sample, setSample] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!isAuthenticated || !isLive) return;
    let cancelled = false;

    const fetchZones = () => {
      setLoading(true);
      setError(null);
      return platform.zones();
    };

    fetchZones()
      .then((rows) => {
        if (cancelled) return;
        setZones(rows);
        setSample(false);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        // Keep the seed polygons on the map so it still reads, but say so.
        setZones(seedZones);
        setSample(true);
        setError(describe(err));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, isLive, reloadKey]);

  /**
   * Writes apply to the list immediately and are reconciled by a reload. A
   * failure says so and puts the server's answer back, rather than leaving the
   * map showing a zone the platform never accepted.
   */
  const after = useCallback((label: string, call: Promise<unknown>) => {
    if (!isLive) return;
    call
      .then(() => reload())
      .catch((err) => {
        pushToast(`${label} failed — ${describe(err)}`);
        reload();
      });
  }, [isLive, reload, pushToast]);

  const create = useCallback((zone: Omit<DeliveryZone, 'id'>) => {
    const optimisticId = `new-${Date.now()}`;
    setZones((prev) => [...prev, { ...zone, id: optimisticId }]);
    pushToast(`${zone.name} created`);
    after('Creating the zone', platform.createZone(zone));
  }, [after, pushToast]);

  const update = useCallback((id: string, patch: Partial<Omit<DeliveryZone, 'id'>>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    after('Updating the zone', platform.updateZone(id, patch));
  }, [after]);

  const remove = useCallback((id: string) => {
    const target = zones.find((z) => z.id === id);
    setZones((prev) => prev.filter((z) => z.id !== id));
    pushToast(target ? `${target.name} deleted` : 'Zone deleted');
    after('Deleting the zone', platform.deleteZone(id));
  }, [after, zones, pushToast]);

  return { zones, loading, error, sample, create, update, remove, reload };
}
