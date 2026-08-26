// Platform configuration, feature flags and the admin accounts themselves.
// Reads are open to any admin; every write here is SuperAdmin-only.

import { useState, useEffect, useCallback } from 'react';
import { platform } from '../services/platformResources';
import { ApiError } from '../services/apiClient';
import { useAuth } from './useAuth';
import { useAppState } from './useAppState';
import {
  platformConfig as seedConfig,
  featureFlags as seedFlags,
  adminUsers as seedAdmins,
} from '../data/platformSeed';
import type {
  PlatformConfig, FeatureFlag, AdminUser, AdminRole, AdminStatus,
} from '../data/types';

export interface PlatformAdminState {
  config: PlatformConfig;
  configError: string | null;
  configLoading: boolean;

  flags: FeatureFlag[];
  flagsError: string | null;

  admins: AdminUser[];
  adminsError: string | null;

  /** True when none of this came from the API. */
  sample: boolean;

  saveConfig: (patch: Partial<PlatformConfig>) => void;
  setFlag: (key: string, enabled: boolean) => void;
  deleteFlag: (key: string) => void;
  createAdmin: (email: string, name: string, role: AdminRole) => void;
  updateAdmin: (id: string, patch: { role?: AdminRole; status?: AdminStatus }) => void;
  deleteAdmin: (id: string) => void;
  reload: () => void;
}

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkFailure) return 'Could not reach the admin API.';
    if (err.isMissingEndpoint) return 'This is not available on the backend.';
    if (err.status === 403) return 'This needs a Super Admin account.';
    return err.message;
  }
  return 'Something went wrong.';
}

export function usePlatformAdmin(): PlatformAdminState {
  const { mode, isAuthenticated, isSuperAdmin } = useAuth();
  const { pushToast } = useAppState();
  const isLive = mode === 'live';

  const [config, setConfig] = useState<PlatformConfig>(seedConfig);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [flags, setFlags] = useState<FeatureFlag[]>(seedFlags);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>(seedAdmins);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [sample, setSample] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!isAuthenticated || !isLive) return;
    let cancelled = false;

    const start = () => {
      setConfigLoading(true);
      setConfigError(null);
      setFlagsError(null);
      setAdminsError(null);
    };
    start();

    platform.config()
      .then((value) => {
        if (cancelled) return;
        setConfig(value);
        setSample(false);
        setConfigLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setConfigError(describe(err));
        setConfigLoading(false);
      });

    platform.featureFlags()
      .then((rows) => { if (!cancelled && rows.length > 0) setFlags(rows); })
      .catch((err) => { if (!cancelled) setFlagsError(describe(err)); });

    // Admin accounts are SuperAdmin-only; a plain admin gets 403 and is told so
    // rather than shown a seeded team that looks like the real one.
    platform.adminUsers()
      .then((rows) => { if (!cancelled) setAdmins(rows); })
      .catch((err) => { if (!cancelled) setAdminsError(describe(err)); });

    return () => { cancelled = true; };
  }, [isAuthenticated, isLive, reloadKey]);

  const write = useCallback((label: string, call: () => Promise<unknown>) => {
    if (!isLive) return;
    call()
      .then(() => reload())
      .catch((err) => {
        pushToast(`${label} failed — ${describe(err)}`);
        reload();
      });
  }, [isLive, reload, pushToast]);

  const saveConfig = useCallback((patch: Partial<PlatformConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    pushToast('Platform configuration saved');
    write('Saving the configuration', () => platform.updateConfig({
      commissionRate: patch.commissionRate ?? undefined,
      serviceFee: patch.serviceFee ?? undefined,
      riderCut: patch.riderCut ?? undefined,
      baseDeliveryFare: patch.baseDeliveryFare ?? undefined,
    }));
  }, [write, pushToast]);

  const setFlag = useCallback((key: string, enabled: boolean) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    write(`Switching ${key}`, () => platform.setFeatureFlag(key, enabled));
  }, [write]);

  const deleteFlag = useCallback((key: string) => {
    setFlags((prev) => prev.filter((f) => f.key !== key));
    pushToast(`${key} removed`);
    write('Removing the flag', () => platform.deleteFeatureFlag(key));
  }, [write, pushToast]);

  const createAdmin = useCallback((email: string, name: string, role: AdminRole) => {
    setAdmins((prev) => [...prev, {
      id: `new-${Date.now()}`, name, email, role,
      status: 'ACTIVE' as AdminStatus, lastLogin: null,
    }]);
    pushToast(`${name} invited`);
    write('Inviting the admin', () => platform.createAdmin(email, name, role));
  }, [write, pushToast]);

  const updateAdmin = useCallback((
    id: string, patch: { role?: AdminRole; status?: AdminStatus },
  ) => {
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    write('Updating the admin', () => platform.updateAdmin(id, patch));
  }, [write]);

  const deleteAdmin = useCallback((id: string) => {
    const target = admins.find((a) => a.id === id);
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    pushToast(target ? `${target.name} removed` : 'Admin removed');
    write('Removing the admin', () => platform.deleteAdmin(id));
  }, [write, admins, pushToast]);

  return {
    config, configError, configLoading,
    flags, flagsError,
    // A plain admin never sees the real list, so seeded names would read as the
    // real team. Show nothing and let the card explain.
    admins: !isLive || isSuperAdmin ? admins : [],
    adminsError,
    sample,
    saveConfig, setFlag, deleteFlag, createAdmin, updateAdmin, deleteAdmin, reload,
  };
}
