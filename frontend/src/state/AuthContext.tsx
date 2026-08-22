import {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { apiClient, ApiError, setUnauthorizedHandler } from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

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

interface AuthValue {
  admin: Admin | null;
  mode: Mode | null;
  isAuthenticated: boolean;
  isSample: boolean;
  isLoading: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  useSampleData: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAdmin(null);
    setMode(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Ask the server who we are rather than trusting anything client-side, so a
  // refresh cannot leave the UI claiming a session the backend disagrees with.
  //
  // Bounded: a slow or unreachable backend must not leave the console sitting
  // on its boot screen. On timeout we fall through to the sign-in page, which
  // is the honest outcome — we could not establish a session.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Admin>(ENDPOINTS.me, undefined, { signal: AbortSignal.timeout(8000) })
      .then((res) => {
        if (cancelled) return;
        setAdmin(res.data ?? {});
        setMode('live');
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await apiClient.post<{ admin?: Admin } & Admin>(
        ENDPOINTS.login, { email, password },
      );
      const payload = res.data ?? {};
      setAdmin(payload.admin ?? payload);
      setMode('live');
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        // The backend reuses AUTH_TOKEN_INVALID for both "no token" and "wrong
        // password", so normalise on status: a 401 from /auth/login can only
        // mean the credentials were rejected.
        const code = err.status === 401 ? 'AUTH_INVALID_CREDENTIALS' : err.code;
        return { success: false, code, message: err.message };
      }
      return {
        success: false,
        code: 'NETWORK_ERROR',
        message: 'Could not reach the server.',
      };
    }
  }, []);

  const useSampleData = useCallback(() => {
    setAdmin({ name: 'Adrian Nkeng', role: 'Platform admin', email: 'sample@reeyo.local' });
    setMode('sample');
  }, []);

  const logout = useCallback(async () => {
    if (mode === 'live') {
      try {
        await apiClient.post(ENDPOINTS.logout);
      } catch {
        // Clear locally regardless of whether the server call succeeded.
      }
    }
    clearSession();
  }, [mode, clearSession]);

  const value = useMemo<AuthValue>(() => ({
    admin,
    mode,
    isAuthenticated: admin !== null,
    isSample: mode === 'sample',
    isLoading,
    role: admin?.role ?? null,
    login,
    useSampleData,
    logout,
  }), [admin, mode, isLoading, login, useSampleData, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
