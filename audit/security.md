# Auth & security review

## Session model — sound

- Auth is **HTTP-only cookie based**, set by the backend on `/auth/login`. The frontend never reads, stores, or forwards a bearer token — `frontend/src/services/apiClient.js` never sets an `Authorization` header, by design (see the file's header comment), so the cookie is the only real credential path. This avoids the classic SPA mistake of stashing a JWT in `localStorage` where it's exposed to any injected/XSS'd script.
- Silent refresh: a `401` outside of `/auth/login` or `/auth/refresh` triggers exactly one `/auth/refresh` attempt (de-duplicated via a shared in-flight `refreshPromise` so concurrent requests don't all trigger their own refresh), then retries the original request once. On failure it calls a registered `unauthorizedHandler` which `AuthContext` uses to clear local state.
- `AuthContext` (`frontend/src/context/AuthContext.jsx`) checks session via `GET /auth/me` on mount, not a client-side guess — so refreshing the page can't leave the UI in a stale "authenticated" state that the backend disagrees with.
- `frontend/vite.config.ts` proxies API calls to keep dev same-origin, avoiding the need for cross-site cookie flags (`SameSite=None; Secure`) in local development.

## Role gating — mostly sound, one cosmetic leak

- Route-level: `/settings/admin-users` and `/settings/api-keys` are wrapped in `RequireSuperAdmin` (`frontend/src/components/routing/ProtectedRoute.jsx`), which checks `isSuperAdmin` from `AuthContext` and renders a `Forbidden` screen instead of the real content for non-super-admins. This is enforced client-side only, as expected for a UX gate — it is not a substitute for backend authorization, and nothing here indicates the backend is trusted to skip its own checks.
- **Cosmetic leak:** `frontend/src/pages/Settings/SettingsPage.jsx:7-48` renders all 8 settings tabs — including "Admin Users" and "API Keys" — as clickable nav links regardless of the viewer's role. A non-super-admin sees both tabs exist and only discovers they're blocked after clicking through to the `Forbidden` screen. Low severity (no data is exposed, and the real gate still holds), but it's an easy fix: filter `settingsTabs` by `isSuperAdmin` before rendering.
- The **sidebar** (`frontend/src/components/layout/Sidebar.jsx`) shows every nav item to every authenticated admin with no per-item role check — consistent with the same pattern (reveals existence, not data).

## Sensitive data handling

- `frontend/src/pages/Settings/components/ApiKeys.jsx` handles raw API key material correctly: the raw key is only ever shown once, immediately after creation (`RawKeyModal`), copy-to-clipboard is provided, and the list view only ever displays `key_prefix` truncated with `...` — never the full key. This is the right pattern.
- `docs/BACKEND_ENDPOINT_REQUESTS.md` confirms `DELETE /users/:userId` is a soft delete (status flip + email/phone anonymization), and the panel's customer-delete flow was updated with a type-DELETE-to-confirm step and copy that accurately describes this as irreversible-in-effect ("deactivates the account and permanently removes contact info") rather than a soft toggle — good alignment between UI copy and actual backend semantics, which matters for an admin action that looks destructive.

## Things that are not security bugs but look adjacent

- `frontend/src/context/ThemeContext.jsx` uses `localStorage` — only for a `'light'|'dark'` string, not session data. Fine.
- No `dangerouslySetInnerHTML`, `eval(`, or direct `document.cookie` access was found anywhere in `frontend/src`.
- No hardcoded secrets, API keys, or credentials were found committed in the frontend source or `.env.example`. `frontend/.env.production` contains only a public API base URL, which its own comment correctly notes is "not secret."

## Not audited (out of scope without backend access)

- Actual authorization enforcement on the `admin-api` side (this audit only has the frontend's contract with it).
- CORS configuration, cookie flags (`Secure`, `SameSite`), and rate limiting on the backend.
- The Supabase project referenced by `frontend/.env.example` / `frontend/supabase/migrations/` — it's unclear whether this is a still-live parallel data store or a retired experiment (see [architecture.md](architecture.md)).
