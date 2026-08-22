# Reeyo Admin Panel — System Audit

Date: 2026-08-22
Scope: `frontend/` (Vite + React admin panel). No `Reeyo-Backend` repo was present to cross-check; findings about the API are based on the frontend's contract with it (`frontend/src/services/apiClient.js`) and `docs/BACKEND_ENDPOINT_REQUESTS.md`.

## How to read this folder

| File | Covers |
|---|---|
| [architecture.md](architecture.md) | Stack, folder structure, routing, state management |
| [api-integration.md](api-integration.md) | Backend wiring status page-by-page — what's live, what's still mock |
| [security.md](security.md) | Auth flow, session handling, role gating, secrets |
| [code-quality.md](code-quality.md) | Tooling gaps, dead code, testing, consistency |
| [documentation.md](documentation.md) | Accuracy check of everything in `docs/` against actual code |
| [bugs-and-gaps.md](bugs-and-gaps.md) | Concrete broken/incomplete features found during this audit |
| [recommendations.md](recommendations.md) | Prioritized punch list |

## Executive summary

The panel is mid-migration: it started as a fully mocked prototype (per `docs/API_INTEGRATION.md`) and, per recent commit history (`Wire admin panel to the real admin-api`, `Integrate new backend endpoints`, `APi intergrations`), most pages have since been switched over to a real `admin-api` backend via a shared, cookie-based `apiClient`. That migration is **largely done and reasonably well-built** (silent-refresh-on-401, typed `ApiError`, envelope parsing) but it is **incomplete and undocumented**:

- **The `docs/` folder describes a system that no longer exists.** It still tells a new contributor the app uses hardcoded `admin@reeyo.com` / `password123` auth and per-component `simulateFetch*()` mocks. That's no longer true for ~30 of the ~35 data-driven pages. See [documentation.md](documentation.md).
- **A handful of features never got migrated** and are still 100% fake: the Chat feature, the Forgot Password flow, and the in-app version control widget. See [api-integration.md](api-integration.md).
- **Two user-facing bugs were found** that are independent of the mock/real split: there is no way to sign out of the app (the button exists but has no handler), and the header always displays "Super Admin / admin@reeyo.com" regardless of who is actually logged in. See [bugs-and-gaps.md](bugs-and-gaps.md).
- **ESLint is effectively not running.** Its config only lints `.ts`/`.tsx` files, but the entire app (75 files) is `.jsx`/`.js`. `npm run lint` passes trivially with zero files checked. See [code-quality.md](code-quality.md).
- **No automated tests exist**, and `docs/DEVELOPMENT.md` acknowledges this is intentional for now.
- Auth/session design itself (HTTP-only cookies, silent refresh, role-gated routes) is sound. See [security.md](security.md) for the caveats.

## Severity-ranked findings

| # | Finding | Severity | File |
|---|---|---|---|
| 1 | No working sign-out in the UI | High | [bugs-and-gaps.md](bugs-and-gaps.md) |
| 2 | ESLint config matches zero real source files | High | [code-quality.md](code-quality.md) |
| 3 | All `docs/` files describe the pre-migration mock system | High | [documentation.md](documentation.md) |
| 4 | Header shows a hardcoded identity, not the logged-in admin | Medium | [bugs-and-gaps.md](bugs-and-gaps.md) |
| 5 | Chat feature and Forgot Password flow are fully mock, no backend calls | Medium | [api-integration.md](api-integration.md) |
| 6 | Settings tabs (Admin Users, API Keys) render for every admin, gated only after navigation | Low | [security.md](security.md) |
| 7 | Zero automated tests | Low (acknowledged) | [code-quality.md](code-quality.md) |
| 8 | Known backend gaps: no order search, no rider reject/KYC verify, no direct refund | Info (backend, not frontend) | [api-integration.md](api-integration.md) |
