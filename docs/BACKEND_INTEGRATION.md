# Backend integration — reeyo Operations Console

How the console talks to `admin-api`, what the backend actually serves, and the
one issue that needs fixing on the backend side.

Everything here was probed against the deployed API on **2026-08-22**, not
inferred from older documentation.

---

## 1. The blocker: non-allowlisted origins get a 500

The deployed API keeps an origin allowlist. Requests from an allowlisted origin
behave correctly. Requests from any other origin return
**`500 INTERNAL_SERVER_ERROR`** instead of a clean CORS rejection.

```
POST /api/v1/auth/login          (no Origin header)                  -> 401 Invalid credentials   correct
POST /api/v1/auth/login          Origin: https://admin.usereeyo.com  -> 401 Invalid credentials   correct
POST /api/v1/auth/login          Origin: https://usereeyo.com        -> 401 Invalid credentials   correct
POST /api/v1/auth/login          Origin: http://localhost:5173       -> 500 An unexpected error   wrong
POST /api/v1/auth/login          Origin: http://localhost:3000       -> 500 An unexpected error   wrong
```

Preflight itself is configured correctly:

```
OPTIONS /api/v1/auth/login  Origin: https://admin.usereeyo.com
  204
  access-control-allow-origin: https://admin.usereeyo.com
  access-control-allow-credentials: true
  access-control-allow-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
  access-control-allow-headers: Content-Type,Authorization
```

**Why it matters.** Browsers attach `Origin` to every cross-origin request and
to same-origin non-GET requests. A developer running the console locally
therefore cannot sign in at all — every attempt returns a 500 that reads like a
server fault rather than "your origin is not allowed".

**Asks for the backend team**

1. Return a proper CORS rejection (or a 403 with a clear code) rather than
   throwing. A rejected origin should never surface as `INTERNAL_SERVER_ERROR`.
2. Add the local dev origin to the allowlist, or expose it as configuration.

**What the console does meanwhile.** `vite.config.ts` rewrites the outgoing
`Origin` on proxied dev requests to an allowlisted value, so local development
works against the live API today. That is a workaround in the dev proxy only —
it does not ship in the production build, and it should be removed once the
backend handles origins properly.

---

## 2. Endpoint map, as probed

A `401` means the route exists and needs a session. A `404` means it is not
built on this deployment.

| Area | Route | Status |
|---|---|---|
| Auth | `/auth/me`, `/auth/login`, `/auth/refresh` | present |
| Orders | `/orders`, `/orders/search` | present |
| Riders | `/riders`, `/riders/:id/deliveries` | present |
| Vendors | `/vendors`, `/vendors/menu-approvals` | present |
| Customers | `/users` | present |
| Disputes | `/disputes` | present |
| Analytics | `/analytics/overview` | present |
| Payouts | `/payouts`, `/payouts/requests` | present |
| Config | `/config`, `/config/settings`, `/config/api-keys` | present |
| Uploads | `/uploads` | present |
| — | `/customers` | **404** — customers are at `/users` |
| — | `/zones`, `/delivery-zones` | **404** |
| — | `/settlements` | **404** |
| — | `/offers`, `/banners`, `/announcements` | **404** |
| — | `/admins` | **404** |

Two corrections to what `BACKEND_ENDPOINT_REQUESTS.md` recorded for the previous
panel:

- **`/orders/search` now exists.** It was previously tracked as a real gap.
- **Customers were never at `/customers`.** They are at `/users`, which matches
  the `DELETE /users/:userId` reference in the older document.

### Consequences for the console

Marketing (offers, banners, announcements, spin wheel), Storefront (banner
order, home sections), delivery zones, teams and fee rules have **no backend
route**. Those screens run on local seed data. They are not presented as live —
see section 4.

---

## 3. How the client is put together

```
src/services/apiClient.ts    fetch wrapper: cookie auth, envelope parsing,
                             typed ApiError, single silent refresh on 401
src/services/endpoints.ts    the map above, in code
src/services/adapters.ts     admin-api payloads -> console types
src/services/resources.ts    one typed loader per collection
src/state/AuthContext.tsx    session: /auth/me on mount, login, logout
src/state/AppState.tsx       loads collections, holds mutations
```

**Auth is cookie-based.** No token is ever read into JavaScript. Every request
sends `credentials: 'include'`; a 401 outside the auth routes triggers one
de-duplicated `/auth/refresh` and one retry before the session is cleared. This
design is carried over deliberately from the previous panel — `audit/security.md`
recommended reusing it verbatim.

**The session check is bounded.** `/auth/me` runs with an 8-second timeout, so a
slow or unreachable API drops through to the sign-in screen instead of leaving
the console on its boot state.

### Adapters are defensive on purpose

Authenticated response shapes could not be inspected from this environment —
every route returns 401 without a session. So `adapters.ts` reads each field
through a list of plausible names with a defined fallback, rather than
committing to one guessed spelling:

```ts
total: num(row, ['total', 'total_amount', 'totalAmount', 'amount', 'grand_total']),
```

**When the real shapes are confirmed, collapse each list to the one true key.**
That is a change to `adapters.ts` alone — no page reads an API payload directly.

### Error codes, as actually returned

| Situation | Status | `error.code` |
|---|---|---|
| Wrong password | 401 | `AUTH_TOKEN_INVALID` (message: `Invalid credentials`) |
| Missing session | 401 | `AUTH_TOKEN_INVALID` (message: `No token provided`) |
| Bad request body | 400 | `VALIDATION_FAILED`, with `details.fields` |
| Origin not allowed | 500 | `INTERNAL_SERVER_ERROR` |

`AUTH_TOKEN_INVALID` covers both "no session" and "wrong password", so the
console normalises on status: a 401 from `/auth/login` can only mean the
credentials were rejected.

---

## 4. Live, sample, and never pretending

The console runs in one of two modes, and the mode is always visible.

- **Live** — signed in against admin-api. Wired pages show real data.
- **Sample** — chosen explicitly from the sign-in screen. Seed data only, with a
  banner on every page and the rail footer reading "Sample data".

Sample mode is **never entered by a failure**. If a live load fails, the page
keeps the seed rows so it still reads, but the banner names the error and offers
a retry. The console should never look connected when it is not.

State is in memory only, per the `CLAUDE.md` hard rule against `localStorage`,
so sample mode does not survive a page reload. That is intended.

---

## 5. Running it

```bash
cd frontend
npm install
npm run dev
```

Point the dev proxy wherever the API is:

```bash
# .env.local — local backend (default)
VITE_PROXY_TARGET=http://localhost:3005

# .env.local — the deployed backend
VITE_PROXY_TARGET=https://admin-api.usereeyo.com
```

Requests go to `/api/v1` and are proxied, so auth cookies stay same-origin.

**Production.** `.env.production` points at `https://admin-api.usereeyo.com/api/v1`
directly. Because the console is then served from a different origin to the API,
the backend must keep sending cookies with `SameSite=None; Secure` and keep the
console's origin on the CORS allowlist with credentials enabled — which it
already does for `https://admin.usereeyo.com`.

---

## 6. Open items

- **Backend:** stop returning 500 for non-allowlisted origins (section 1).
- **Backend:** confirm the authenticated response shapes so `adapters.ts` can be
  narrowed from "several plausible keys" to the real ones.
- **Backend:** confirm the mutation contracts the console calls —
  `PATCH /orders/:id`, `POST /orders/:id/assign-rider`,
  `POST /payouts/requests/:id/approve`, `POST /payouts/requests/:id/decline`.
  These follow the pattern of the rest of the API but were not verifiable
  without a session.
- **Product:** decide whether offers, banners, announcements, zones, teams and
  fee rules should get endpoints, or stay console-local.
