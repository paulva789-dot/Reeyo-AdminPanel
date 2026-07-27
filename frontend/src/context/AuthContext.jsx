// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError, setUnauthorizedHandler } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAdmin(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setAdmin(res.data);
      })
      .catch(() => {
        if (!cancelled) setAdmin(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      setAdmin(res.data.admin);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, code: err.code, message: err.message };
      }
      return { success: false, code: 'NETWORK_ERROR', message: 'Could not reach the server.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Clear local session regardless of whether the server call succeeded.
    }
    clearSession();
  }, [clearSession]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, code: err.code, message: err.message };
      }
      return { success: false, code: 'NETWORK_ERROR', message: 'Could not reach the server.' };
    }
  }, []);

  const value = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    role: admin?.role ?? null,
    isSuperAdmin: admin?.role === 'SUPER_ADMIN',
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
