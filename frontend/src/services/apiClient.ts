// Thin fetch wrapper around the admin-api response envelope:
//   success -> { success: true, data, meta }
//   error   -> { success: false, error: { code, message, details }, timestamp, path }
//
// Auth is cookie-based (HTTP-only access/refresh cookies set by the backend on
// /auth/login), so every request is sent with credentials: 'include' and no
// token is ever read or stored by this client. On a 401 (other than from the
// auth endpoints themselves) we attempt a single silent refresh via
// /auth/refresh and retry the original request once before giving up.
//
// This design is carried over deliberately from the previous admin panel —
// see audit/security.md, which recommended reusing it verbatim.

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** True when the failure means "no usable session", not "server broke". */
  get isAuthFailure(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** True when the endpoint is not built on this backend yet. */
  get isMissingEndpoint(): boolean {
    return this.status === 404;
  }

  /** True when the request never reached the server at all. */
  get isNetworkFailure(): boolean {
    return this.status === 0;
  }
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number };
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered by AuthContext so the client can clear session state when even a
 *  token refresh fails (refresh cookie expired or revoked). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

let refreshPromise: Promise<boolean> | null = null;

function isAuthEndpoint(path: string): boolean {
  return path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
}

/** De-duplicated: concurrent 401s share one refresh rather than stampeding. */
async function refreshSession(): Promise<boolean> {
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

async function parseBody(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  { body, params, signal }: RequestOptions = {},
  isRetry = false,
): Promise<Envelope<T>> {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    }
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    // status 0 distinguishes "never reached the server" from any HTTP status.
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server.', 0, cause);
  }

  const payload = await parseBody(response);

  if (response.status === 401 && !isAuthEndpoint(path) && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(method, path, { body, params, signal }, true);
    }
    unauthorizedHandler?.();
    throw new ApiError('AUTH_TOKEN_INVALID', 'Session expired. Please sign in again.', 401);
  }

  if (!response.ok || payload?.success === false) {
    const error = payload?.error as
      { code?: string; message?: string; details?: unknown } | undefined;
    throw new ApiError(
      error?.code || 'INTERNAL_ERROR',
      error?.message || response.statusText || 'Request failed',
      response.status,
      error?.details,
    );
  }

  return (payload ?? { success: true, data: null }) as unknown as Envelope<T>;
}

async function upload(file: File): Promise<Envelope<{ url: string }>> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const payload = await parseBody(response);

  if (!response.ok || payload?.success === false) {
    const error = payload?.error as { code?: string; message?: string } | undefined;
    throw new ApiError(
      error?.code || 'INTERNAL_ERROR',
      error?.message || response.statusText || 'Upload failed',
      response.status,
    );
  }

  return payload as unknown as Envelope<{ url: string }>;
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params'], opts?: RequestOptions) =>
    request<T>('GET', path, { params, ...opts }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { body, ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { body, ...opts }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { body, ...opts }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, { ...opts }),
  upload,
};

export { API_BASE_URL };
