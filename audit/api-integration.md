# Backend API integration status

## The client (`frontend/src/services/apiClient.js`)

A single shared fetch wrapper, well-designed for its purpose:
- Talks to `admin-api` at `VITE_API_BASE_URL` (dev: proxied through Vite to `http://localhost:3005/api/v1`, same-origin so HTTP-only cookies flow; prod: `https://admin-api.usereeyo.com/api/v1`, set in `frontend/.env.production`).
- Cookie-based auth (`credentials: 'include'`) — no token is ever read from or written to `localStorage`/JS-visible storage.
- On a `401` (outside of the auth endpoints themselves), it transparently calls `/auth/refresh` once and retries the original request before giving up and invoking a registered `unauthorizedHandler` (wired by `AuthContext` to clear local session state).
- Normalizes the backend's `{ success, data, meta }` / `{ success: false, error }` envelope into a typed `ApiError` (`code`, `message`, `status`, `details`).

This is solid, idiomatic for a cookie-session SPA, and matches what `docs/BACKEND_ENDPOINT_REQUESTS.md` says the backend was standardized to (`/auth/refresh`, not the older `/auth/refresh-token`).

## Pages confirmed wired to real endpoints via `apiClient`

30 files call `apiClient.get/post/put/patch/delete`, including: `DashboardOverview`, `OrderManagement` + `OrderDetailsModal`, `CustomerManagement`, `VendorManagement`, `MenuApprovals`, `RiderManagement`, `FinancePage` + `SettlementManagement`, `DisputesPage`, `AnalyticsPage`, `AnnouncementsPage` + `AnnouncementForm`, `LiveTracker`, `DeliveryZones`, `Marketing/BannerManagement`, `Marketing/DiscountManagement`, `Engagement/*` (LoyaltyManagement, SpinWheels, Popups, PreferenceTags, SharedCarts, TrackingFacts), `Settings/*` (PlatformServices, OperationalParameters, Integrations, FeatureFlags, ApiKeys, AdminUsers), and `AuthContext` itself.

## Pages still fully mock / not wired at all

| Feature | File(s) | What it actually does today |
|---|---|---|
| Chat | `frontend/src/pages/Chat/components/Chatwindow.jsx`, `ChatSideBar.jsx` | Imports static `chatMessages`, `chatUsers`, `currentAdmin` from `frontend/src/data/chatMocks.js`. No `apiClient` calls at all — this is a fully static UI, not just "not yet loaded," and `docs/BACKEND_ENDPOINT_REQUESTS.md` confirms there are no chat/messaging endpoints on the backend at all yet. |
| Forgot Password | `frontend/src/pages/Auth/components/ForgotPasswordForm.jsx` | `handleSubmit` runs a bare `setTimeout(..., 1500)` and always reports success (after a trivial client-side email-format check) — comment literally says "In a real app, you would send the email here." No backend call, no real password-reset flow exists behind this screen. |
| App Version Control | `frontend/src/pages/Announcements/components/AppVersionControl.jsx` | Seeded from `frontend/src/data/announcementMocks.js` (`appVersions`), edited only in local state. `docs/BACKEND_ENDPOINT_REQUESTS.md` explicitly lists "app version gating" under features with no backend endpoints yet. |
| Delivery zone / menu-approval formatting helpers | `ZoneSidebar.jsx`, `ZoneMap.jsx`, `ApprovalRequestCard.jsx`, `ApprovalDetailsModal.jsx` | These still import small pure helper functions (`formatFCFA`, `formatDeliveryFee`, `colorForZoneId`) from the `data/*Mocks.js` files — not a data-fetching gap, just formatting utilities that happen to live in a file named like a mock. Low priority to move, but worth renaming/relocating so "still imports from `data/`" isn't a false positive when auditing migration progress. |

## Known backend-side gaps (from `docs/BACKEND_ENDPOINT_REQUESTS.md`, dated as the panel's own last audit)

These are not frontend bugs — the panel has already adapted its UI to their absence — but they're real product gaps worth tracking:

- **No rider reject / KYC document verification endpoints.** The panel shows an amber "not available yet" notice in the rider detail modal instead of a broken action.
- **No order search across the full dataset** (`GET /orders/search` requested, not built) — the search box only filters the already-loaded page.
- **No direct refund endpoint** and no admin-initiated "create a dispute" endpoint — an admin cannot refund an order that has no pre-existing customer-filed dispute. Flagged as a product decision, not a code task.
- Dispute **reject** was just wired into the panel (`POST /disputes/:disputeId/reject`) alongside the pre-existing `resolve`, but the request body shape (`{ reason }`) is a guess pending backend confirmation.
- `GET /riders/:riderId/deliveries` exists on the backend but isn't used anywhere in the panel yet (parity gap vs. the vendor detail view's "Recent Orders" section).
- No endpoints for: customer behavior analytics, fleet-wide ops metrics (on-time %, CSAT), general discount/promo campaigns independent of Loyalty/Spin Wheel, admin security policy config.

## Environment configuration

- `frontend/.env.example` documents `VITE_API_BASE_URL` (dev default `/api/v1`, proxied) and the two Supabase vars.
- `frontend/.env.production` pins `VITE_API_BASE_URL=https://admin-api.usereeyo.com/api/v1`, with a comment noting the hosting platform's own dashboard var takes precedence if set — a reasonable "portable fallback" design.
- `frontend/vite.config.ts` proxies `/api/v1` to `http://localhost:3005` in dev specifically so auth cookies stay same-origin — consistent with the cookie-based auth design.
