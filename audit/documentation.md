# Documentation accuracy audit

Every file in `docs/` was checked against the current `frontend/` source. Summary: **the whole folder describes the pre-migration state of the app.** It was clearly written when the panel was mock-only and has not been touched since the real `admin-api` integration landed (per git log: `Wire admin panel to the real admin-api, replacing mock data throughout`, `Integrate new backend endpoints...`, `APi intergrations`, `new fix`, `Set production admin-api URL for deployed builds`).

## `docs/API_INTEGRATION.md` — fully superseded

The entire document is a "how to migrate off mocks" guide, written as if that migration hasn't started:
- Says auth is "Currently uses **hardcoded demo credentials**" (`admin@reeyo.com` / `password123`) with a code sample showing a synchronous mock `login()`. The real `AuthContext.jsx` calls `POST /auth/login` against the live backend and has no hardcoded credentials anywhere.
- Describes a `src/services/api.js` client to be created "once ready to connect to real APIs" — that file was actually built as `src/services/apiClient.js`, with a materially different (and better) design: cookie auth instead of `Bearer` tokens read from `localStorage`, envelope parsing, and silent 401 refresh. Anyone following this doc's "Step 1" would build a second, contradictory API client.
- Lists mock-data file locations (`src/pages/Vendors/VendorManagement.jsx`, `src/pages/Customers/CustomerManagement.jsx`, `src/pages/Finance/FinanceManagement.jsx`) that don't match the real paths (`src/pages/Users/Vendors/VendorManagement.jsx`, `src/pages/Users/Customers/CustomerManagement.jsx`, `src/pages/Finance/FinancePage.jsx`).
- The backend base URL and endpoint list it documents (`http://localhost:3005/api`, `/auth/verify`) don't match current reality (`/api/v1` prefix per `.env.example` and `vite.config.ts`; refresh path is `/auth/refresh` per `docs/BACKEND_ENDPOINT_REQUESTS.md`, not `/auth/verify`).
- **Recommendation:** replace this file entirely. It should describe the *current* `apiClient` contract (envelope shape, cookie auth, refresh behavior) as reference documentation, not a forward-looking migration guide — the migration it describes is done.

## `docs/FOLDER_STRUCTURE.md` — describes a different folder layout

- Lists `src/data/customerMocks.js`, `financeMocks.js`, `sidebarNav.js`, `trackingMocks.js` — none of these exist. The real `src/data/` only has `announcementMocks.js`, `chatMocks.js`, `menuApprovalMocks.js`, `zoneMocks.js`.
- Sidebar nav is actually defined inline in `src/components/layout/Sidebar.jsx`, not in a separate `src/data/sidebarNav.js`.
- Shows a `Footer.jsx` under `layout/` that doesn't exist — `DashboardLayout.jsx` only composes `Header` + `Sidebar`.
- Gives an example import `import { Header } from '@/components/layout/Header'` implying a `@/` path alias — no such alias is configured in `vite.config.ts` or `tsconfig.json`; all real imports in the codebase are relative (`../../components/...`).
- Shows illustrative "key patterns" (`OrderList.jsx`, `OrderDetail.jsx`, `OrderForm.jsx` under `src/pages/Orders/`) that don't match the real files there (`OrderManagement.jsx`, `OrderCard.jsx`, `OrderDetailsModal.jsx`, `OrderFilterBar.jsx`, `OrderStatsCards.jsx`).

## `docs/GETTING_STARTED.md` / `docs/INSTALLATION.md` — env var name is wrong

Both instruct editing `VITE_API_URL`. The actual variable, used by `apiClient.js` and defined in `.env.example`/`.env.production`, is **`VITE_API_BASE_URL`**. Following either doc as written would silently have no effect (the app would just fall back to the default `/api/v1`), which is a confusing failure mode for a new contributor trying to point the panel at a different backend.

`docs/TROUBLESHOOTING.md` repeats the same wrong variable name (`VITE_API_URL`) under "API calls fail".

## `docs/DEVELOPMENT.md` — accurate, just thin

The only doc file that doesn't contradict the current codebase. Correctly notes there's no test runner included, and the Node/npm setup steps match `package.json`. Could be expanded (see [recommendations.md](recommendations.md)) but has no factual errors.

## `docs/ARCHITECTURE.md` and `docs/BACKEND_ENDPOINT_REQUESTS.md` — accurate

- `ARCHITECTURE.md` is high-level enough that it hasn't gone stale (correctly lists Vite + React + Tailwind + Supabase-present-but-only-for-migrations).
- `BACKEND_ENDPOINT_REQUESTS.md` is clearly a living document maintained in step with the actual migration (it explicitly tracks what's "confirmed and actioned" vs. "still open") and is the most trustworthy file in the folder — it should be the model for how the rest of `docs/` gets rewritten.

## Root `README.md`

States: "The admin panel currently uses **mock data with simulated API calls** to demonstrate functionality. Backend integration is ready—see API_INTEGRATION.md for migration steps." This is the single most misleading line in the repo for a new reader — the migration isn't "ready to start," it's mostly *done*. Also still lists the demo credentials (`admin@reeyo.com` / `password123`) as if they're the way into the app; real login now requires whatever credentials the connected `admin-api` actually issues.
