// src/services/apiClient.js
//
// Thin fetch wrapper around the admin-api's response envelope:
//   success -> { success: true, data, meta }
//   error   -> { success: false, error: { code, message, details, timestamp } }
//
// Auth is cookie-based (HTTP-only access/refresh cookies set by the backend on
// /auth/login), so every request is sent with credentials: 'include' and no
// token is ever read or stored by this client. On a 401 (other than from the
// auth endpoints themselves) we attempt a single silent refresh via
// /auth/refresh and retry the original request once before giving up.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let unauthorizedHandler = null;

// Registered by AuthContext so the client can clear session state when even
// a token refresh fails (e.g. refresh cookie expired or revoked).
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

let refreshPromise = null;

function isAuthEndpoint(path) {
  return path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(method, path, { body, params, signal } = {}, _isRetry = false) {
  let url = `${API_BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, value);
      }
    }
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const payload = await parseBody(response);

  if (response.status === 401 && !isAuthEndpoint(path) && !_isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request(method, path, { body, params, signal }, true);
    }
    unauthorizedHandler?.();
    throw new ApiError('AUTH_TOKEN_INVALID', 'Session expired. Please log in again.', 401);
  }

  if (!response.ok || payload?.success === false) {
    const error = payload?.error;
    throw new ApiError(
      error?.code || 'INTERNAL_ERROR',
      error?.message || response.statusText || 'Request failed',
      response.status,
      error?.details,
    );
  }

  return payload;
}

export const apiClient = {
  get(path, params, opts) {
    return request('GET', path, { params, ...opts });
  },
  post(path, body, opts) {
    return request('POST', path, { body, ...opts });
  },
  patch(path, body, opts) {
    return request('PATCH', path, { body, ...opts });
  },
  put(path, body, opts) {
    return request('PUT', path, { body, ...opts });
  },
  delete(path, opts) {
    return request('DELETE', path, { ...opts });
  },
};
