# Recommendations (prioritized)

## Do first (small, high-impact fixes)

1. **Wire up Sign Out.** `frontend/src/components/layout/Header.jsx` — import `useAuth`, call `logout()` from the "Sign Out" button's `onClick`, redirect to `/login` after. See [bugs-and-gaps.md](bugs-and-gaps.md) #1.
2. **Fix the ESLint glob.** `frontend/eslint.config.js:11` — change `files: ['**/*.{ts,tsx}']` to include `.js`/`.jsx`. Run `npm run lint` afterward and expect a real (possibly nontrivial) list of findings, since this is the first time it will have actually run against the app. See [code-quality.md](code-quality.md).
3. **Make the header show the real admin.** Read `admin`/`role`/`isSuperAdmin` from `useAuth()` in `Header.jsx` instead of the hardcoded "Super Admin / admin@reeyo.com" strings. See [bugs-and-gaps.md](bugs-and-gaps.md) #2.
4. **Rewrite the root `README.md` migration-status line.** It currently tells every new reader the app is mock-only; that's the most visible piece of stale documentation in the repo.

## Do next (documentation rewrite)

5. **Replace `docs/API_INTEGRATION.md`** with a reference doc for the *actual* `apiClient.js` contract (envelope shape, cookie auth, 401-refresh behavior, how to add a new endpoint call) — see [documentation.md](documentation.md) for exactly what's wrong with the current version.
6. **Fix the env var name** (`VITE_API_URL` → `VITE_API_BASE_URL`) in `docs/GETTING_STARTED.md`, `docs/INSTALLATION.md`, and `docs/TROUBLESHOOTING.md`.
7. **Rewrite `docs/FOLDER_STRUCTURE.md`** against the real `src/data/`, `src/pages/Orders/`, and `src/components/layout/` contents — it currently documents files that don't exist and omits real ones.
8. Use `docs/BACKEND_ENDPOINT_REQUESTS.md` as the template for tone/maintenance going forward — it's the one doc in the folder that's stayed accurate because it's treated as a living tracker, not a one-time writeup.

## Medium-term

9. **Decide the fate of the four remaining mock-backed features** (Chat, Forgot Password, App Version Control, and the two formatting-helper imports from `data/*Mocks.js`) — either schedule their backend work (some of this is already tracked in `docs/BACKEND_ENDPOINT_REQUESTS.md`) or give the unwired ones (Chat, Forgot Password) an honest "not available yet" UI treatment instead of a UI that behaves as if it works. See [api-integration.md](api-integration.md) and [bugs-and-gaps.md](bugs-and-gaps.md) #3–4.
10. **Filter the Settings tab list by role** in `SettingsPage.jsx` so non-super-admins don't see tabs they'll immediately be blocked from. Small, self-contained fix. See [bugs-and-gaps.md](bugs-and-gaps.md) #5.
11. **Resolve the Supabase question.** Either start using `frontend/src/lib/supabase.js` and the migration in `frontend/supabase/migrations/`, or remove the dependency, the client file, and the migrations folder. Right now it's shipped weight with no owner.
12. **Add a minimal test suite** once ESLint is actually running — start with `apiClient.js`'s retry/refresh logic and `ProtectedRoute.jsx`'s role gating, both pure enough to test cheaply and both guard real security/session behavior.

## Not this repo's job, but worth flagging to whoever owns the backend

The three items already tracked in `docs/BACKEND_ENDPOINT_REQUESTS.md` as genuinely open: rider reject/KYC verification endpoints, `GET /orders/search`, and a direct-refund path independent of an existing dispute. None of these are frontend defects — the panel has already adapted its UI to their absence — but they're real capability gaps for whoever operates this panel day-to-day.
