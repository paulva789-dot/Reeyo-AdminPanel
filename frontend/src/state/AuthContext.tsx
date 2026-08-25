import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from './useAuth';
import type { Admin, AuthValue, LoginResult, Mode } from './useAuth';
import { apiClient, ApiError, setUnauthorizedHandler } from '../services/apiClient';
import { ENDPOINTS } from '../services/endpoints';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Set as soon as a session is established by an explicit act — signing in, or
   * choosing sample data. The initial /auth/me runs with a timeout, so it can
   * still be in flight when the user picks one of those; without this guard its
   * late rejection would call clearSession() and silently throw away the
   * session they just chose.
   */
  const sessionClaimed = useRef(false);

  const clearSession = useCallback(() => {
    sessionClaimed.current = false;
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
        // A session chosen while this was in flight wins; do not overwrite it.
        if (cancelled || sessionClaimed.current) return;
        sessionClaimed.current = true;
        setAdmin(res.data ?? {});
        setMode('live');
      })
      .catch(() => {
        if (cancelled || sessionClaimed.current) return;
        clearSession();
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
      sessionClaimed.current = true;
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
    sessionClaimed.current = true;
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
    // Sample mode gets the full console so every screen is reachable; the
    // banner already says nothing there is real.
    isSuperAdmin: mode === 'sample'
      || String(admin?.role ?? '').toUpperCase().replace(/[\s-]/g, '_') === 'SUPER_ADMIN',
    login,
    useSampleData,
    logout,
  }), [admin, mode, isLoading, login, useSampleData, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
