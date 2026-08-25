// Context, types and hook, kept out of the provider module so the provider can
// Fast Refresh. See appStateContext.ts for the same reasoning.

import { createContext, useContext } from 'react';

export interface Admin {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

/**
 * 'live'   — signed in against admin-api, every wired page shows real data.
 * 'sample' — explicitly chosen from the sign-in screen; seed data only, and the
 *            UI says so on every page. Never entered silently by a failure.
 */
export type Mode = 'live' | 'sample';

export interface LoginResult {
  success: boolean;
  code?: string;
  message?: string;
}

export interface AuthValue {
  admin: Admin | null;
  mode: Mode | null;
  isAuthenticated: boolean;
  isSample: boolean;
  isLoading: boolean;
  role: string | null;
  /**
   * A large part of admin-api is SuperAdmin-only — config writes, feature
   * flags, API keys, admin users, every engagement write. Without this the
   * console shows those controls to everyone and the request 403s in silence.
   */
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  useSampleData: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

