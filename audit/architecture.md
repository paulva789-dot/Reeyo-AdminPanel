# Architecture

## Stack

- **Build tool:** Vite 8, `@vitejs/plugin-react`
- **Framework:** React 18.3 (JSX, not TSX — see [code-quality.md](code-quality.md))
- **Routing:** `react-router-dom` v7, client-side, all page components lazy-loaded via `React.lazy` (`frontend/src/App.jsx`)
- **Styling:** Tailwind CSS 3 + hand-written gradient/utility classes; `framer-motion` for animation
- **Charts/maps:** `recharts`, `leaflet` + `react-leaflet` + `leaflet-draw` (used by Logistics/DeliveryZones and LiveTracker)
- **Icons:** `lucide-react`, `react-icons`
- **Auth/data:** custom `apiClient` (fetch wrapper) talking to a separate `admin-api` service; `@supabase/supabase-js` is present but only used by `frontend/src/lib/supabase.js`, which nothing else in the app imports (dead code / unused integration point — see below)
- **Language:** Almost entirely plain JS/JSX. TypeScript is configured (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`) but the only `.ts`/`.tsx` file in `src/` is the auto-generated `vite-env.d.ts`.

## Repo layout

```
Reeyo-AdminPanel/
├── docs/                      # Markdown docs (stale — see documentation.md)
├── audit/                     # This audit (new)
└── frontend/
    ├── src/
    │   ├── App.jsx             # Route table
    │   ├── main.jsx             # Entry point: BrowserRouter > AuthProvider > ThemeProvider > App
    │   ├── context/             # AuthContext, ThemeContext
    │   ├── services/apiClient.js
    │   ├── lib/supabase.js      # Unused elsewhere
    │   ├── data/                 # Leftover mock data files, still imported by a few pages
    │   ├── components/           # Shared layout + routing components
    │   └── pages/                 # One folder per nav section (see below)
    └── supabase/migrations/       # One SQL migration file — schema for a Supabase-backed
                                     # setup that the app doesn't currently read from
```

## Route map (`frontend/src/App.jsx`)

Public: `/login`, `/forgot-password`
Protected (wrapped in `DashboardLayout` via `ProtectedRoute`):
`/`, `/orders`, `/users/customers`, `/users/delivery-guys`, `/users/vendors`, `/users/vendors/approvals`, `/logistics/live`, `/logistics/zones`, `/finance`, `/announcements`, `/disputes`, `/engagement`, `/analytics`, `/marketing`, `/chat`, `/cms/customers`, and a nested `/settings/*` (access, operational, integrations, services, feature-flags, admin-users*, api-keys*, data — *`admin-users` and `api-keys` are additionally wrapped in `RequireSuperAdmin`).
Fallback `*` redirects to `/` (if authenticated) or `/login`.

This matches the sidebar nav (`frontend/src/components/layout/Sidebar.jsx`) one-for-one — no orphaned routes or dead nav links were found.

## State management

No global state library (Redux/Zustand/Jotai). State is:
- **Auth**: `AuthContext` (`frontend/src/context/AuthContext.jsx`) — holds the logged-in `admin` object, derives `isAuthenticated`/`role`/`isSuperAdmin`.
- **Theme**: `ThemeContext` (`frontend/src/context/ThemeContext.jsx`) — light/dark, persisted to `localStorage`, also respects `prefers-color-scheme`.
- **Everything else**: local `useState`/`useEffect` per page, fetching directly through `apiClient` in `useCallback`-wrapped fetch functions. This is consistent across ~30 pages and is a reasonable pattern for an app this size — no premature global-store abstraction, which is appropriate here.

## Notable dead/unused code

- `frontend/src/lib/supabase.js` creates a Supabase client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, but no page or component imports `supabase` from it. The `@supabase/supabase-js` dependency and the `frontend/supabase/migrations/` SQL file are the only other traces of this integration path.
- `frontend/src/App.jsx:96` has a commented-out `LiveQueue` route/import for a "Support System" that was apparently planned and shelved.
