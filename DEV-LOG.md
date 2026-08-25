# Dev log — reeyo Operations Console

Running record of what is built, what is not, and every change made against the
verified API. **Updated on every change**, newest entry at the top of the log.

- Source of truth for the API: [`docs/ADMIN-API-ENDPOINT-REFERENCE.md`](docs/ADMIN-API-ENDPOINT-REFERENCE.md)
- Design spec: [`CLAUDE.md`](CLAUDE.md)
- History of how the console got here: [`audit/session-log.md`](audit/session-log.md)

---

## 1. Where the console stands today

Thirteen pages exist and render. Auth, region scoping, the design system, the
check suites and the tooling are all in place. What follows is only about how
much of it is really wired to the API.

### Correctly wired, confirmed against the reference

| Area | Endpoint | Notes |
|---|---|---|
| Auth | `/auth/login`, `/auth/me`, `/auth/logout`, `/auth/refresh` | Cookie path, silent refresh, bounded session check |
| Orders list | `GET /orders` | |
| Order search | `GET /orders/search?q=` | Falls back from local filtering |
| Riders list | `GET /riders` | |
| Vendors list | `GET /vendors` | |
| Customers | `GET /users` | |
| Disputes | `GET /disputes`, `POST /:id/resolve`, `POST /:id/reject` | |
| Menu approvals | `GET /menu-approvals`, `POST /:id/approve`, `POST /:id/reject` | |
| API keys | `GET/POST/DELETE /config/api-keys` | Needs SuperAdmin gating — see P1 |
| Assign rider | `POST /orders/:id/assign-rider` | Body `{ riderId }` confirmed correct |

### Wired to endpoints that do not exist — must be fixed first

These are calls the console makes today that the API has no route for. They fail
silently in live mode (the UI keeps seed rows and flags an error), but they are
wrong and are the first thing to correct.

| Console calls | Reality | Impact |
|---|---|---|
| `PATCH /orders/:id` to change status | **No generic status endpoint.** Only `cancel` and `assign-rider` | The order status dropdown cannot work as built |
| `GET /payouts` | Real: `/payouts/pending?type=`, `/payouts/history` | Payments ledger loads nothing |
| `GET /payouts/requests` | Real: `/payouts/pending?type=VENDOR\|RIDER` | Payout queue loads nothing |
| `POST /payouts/requests/:id/approve` | Real: `POST /payouts/:id/approve` with `{ type }` | Approving a payout does nothing server-side |
| `POST /payouts/requests/:id/decline` | Real: `POST /payouts/:id/reject` with `{ type, reason }` | Same |
| `GET /analytics/overview` | Real: `/analytics/platform`, `/revenue`, `/top-vendors`, `/top-riders`, `/order-status`, `/live` | Analytics has no live source at all |
| `POST /disputes/:id/messages` | **Does not exist** — I carried it over from the old panel | The reply box cannot work |
| `GET /config/settings` | Real: `/config`, `/config/feature-flags` | Settings has no live source |

### Declared "no backend route" — but the routes exist

My earlier probing missed these because I guessed the wrong paths. Each is a
feature currently running on seed data that could be real.

| Feature | Real endpoint | I had probed |
|---|---|---|
| Delivery zones | `/logistics/zones` (full CRUD, polygon) | `/zones`, `/delivery-zones` |
| Banners | `/engagement/banners` | `/banners` |
| Spin wheels | `/engagement/spin-wheels` + segments + results | — |
| Popups | `/engagement/popups` + stats | — |
| Loyalty | `/engagement/loyalty/rules`, `/rewards`, `/accounts/:userId` | — |
| Preference tags | `/engagement/preference-tags` | — |
| Shared carts | `/engagement/shared-carts` | — |
| Tracking facts | `/engagement/tracking-facts` | — |
| Announcements | `/broadcast/users` \| `/vendors` \| `/riders` (push) | `/announcements` |
| Admin users | `/admin-users` | `/admins` |
| Vendor menus | `GET /vendors/:id/menu-items` | assumed none existed |
| Rider map | `GET /riders/live-locations` | assumed none existed |

### Endpoints with no frontend at all

| Endpoint | What it would give an admin |
|---|---|
| `POST /users/:id/suspend`, `/unsuspend`, `DELETE /users/:id` | Acting on a customer |
| `GET /users/:id/orders` | A customer's order history |
| `POST /vendors/:id/approve`, `/reject`, `/suspend` | The vendor approval queue |
| `PATCH /vendors/:id`, `/feature`, `/commission` | Editing a vendor, featuring, commission |
| `GET /vendors/:id/orders` | A vendor's recent orders |
| `POST /riders/:id/approve`, `/reject`, `/suspend` | The rider approval queue |
| `POST /riders/:id/verify-documents` | KYC review — the capability the old panel lost |
| `PATCH /riders/:id` | Editing a rider |
| `GET /orders/:id/timeline` | Real journey data instead of a derived one |
| `POST /orders/:id/cancel` | Cancelling with a reason |
| `GET /config/feature-flags`, `PATCH`, `DELETE` | Feature flag control |
| `PATCH /config` | Commission and platform config |
| `POST /uploads` | Images for banners, popups, rewards |
| `PATCH /engagement/vendors/:id/badges`, `/menu-items/:id/upsell` | Merchandising controls |

---

## 2. The plan, in phases

Each phase is independently shippable and ends green: `npm run typecheck`,
`npm run lint`, `npm run checks`. Every phase appends to the log in section 3.

### Phase 0 — Correct what is wrong ✅ **done 2026-08-25**
Fix the eight calls that target routes which do not exist, and rewrite the
endpoint map from the reference. No new features. This is the phase that stops
the console lying about what it can do.

- Rewrite `services/endpoints.ts` from the reference, with SuperAdmin marked
- Payouts: `/payouts/pending?type=`, `/payouts/history`, approve/reject with `{ type }`
- Analytics: point at the six real endpoints
- Orders: remove the status dropdown's fake write; keep `cancel` and `assign-rider`
- Disputes: remove the reply box (no messages endpoint) or mark it local-only
- Config: `/config` and `/config/feature-flags`
- Update `LocalOnly` markers so they name only genuinely absent features

### Phase 1 — Role awareness
A large part of the API is SuperAdmin-only. The console currently shows those
controls to everyone and lets the request 403 in silence.

- Read `role` from `/auth/me`, expose `isSuperAdmin`
- Gate API keys, feature flags, admin users, and every engagement write
- Show a clear "needs Super Admin" state rather than a dead button

### Phase 2 — Approval queues ← **next**
Vendors and riders waiting on a decision, with the KYC review the old panel lost.

- Vendor approvals: approve / reject with reason / suspend
- Rider approvals: approve / reject / suspend
- Rider document verification against the five real document types
- Badges on the rail, consistent with Orders and Disputes

### Phase 3 — Real analytics
Replace the derived-and-gated figures with the six analytics endpoints, and use
`/analytics/live` for the Overview's live rail.

### Phase 4 — Delivery zones for real
`/logistics/zones` with polygon CRUD. This is the one place the console needs a
map drawing surface; the spec forbids a chart library but says nothing about
maps, so **this needs a decision from you** — see the questions below.

### Phase 5 — Engagement suite
Banners, popups, spin wheels, loyalty rules and rewards, preference tags,
tracking facts, shared carts, badges and upsell. Replaces most of what
Marketing and Storefront currently fake, and needs `/uploads` for images.

### Phase 6 — Broadcast
Turn the Announcements composer into real push via `/broadcast/*`, with the
audience picker mapping to the three real routes.

### Phase 7 — Detail views
`/orders/:id/timeline`, `/users/:id/orders`, `/vendors/:id/orders`,
`/vendors/:id/menu-items`, `/riders/:id/deliveries`. Fills the drawers with real
history instead of derived summaries.

### Phase 8 — Admin users and platform config
`/admin-users` CRUD and `PATCH /config`, both SuperAdmin.

---

## 3. Change log

Newest first. Every entry names what changed and why.

### 2026-08-25 — Phase 0: corrected every call that targeted a route which does not exist

`services/endpoints.ts` rewritten from the reference — the whole surface now,
including the routes not yet used, with SuperAdmin-only paths marked and
`HEALTH_PATH` noted as living outside `/api/v1`.

**Calls corrected**

- **Order status.** There is no generic status endpoint, so the dropdown was
  writing to a route that does not exist. Status is now a read-only pill, and
  `Mark delivered` is gone — the platform moves an order through its stages.
  Cancelling is the one status a console can set and now goes to
  `POST /orders/:id/cancel` with the reason the API requires, behind a
  confirmation that says the cancellation cannot be undone from here.
- **Payouts.** `/payouts` and `/payouts/requests` do not exist. The ledger now
  reads `/payouts/history`; the queue merges `/payouts/pending?type=VENDOR` and
  `?type=RIDER`, keeping each row's type because approve and reject both need
  it. Approve posts `{ type }`, reject posts `{ type, reason }` — so declining
  now asks for a reason instead of sending a canned string.
- **Dispute replies.** `POST /disputes/:id/messages` never existed; I had
  carried it over from the old panel. The reply box is gone and the drawer says
  plainly that resolve and reject are the only dispute writes.
- **Analytics.** `/analytics/overview` does not exist. The six real endpoints
  are now in the map, ready for Phase 3.
- **Config.** `/config/settings` replaced with `/config` and
  `/config/feature-flags`.

**Local-only notices corrected.** `LocalOnly` now distinguishes *no route
exists* from *the route exists and this screen is not wired to it yet*, and
names the path in the second case. Twelve features had been claiming the first
when the second was true — delivery zones are `/logistics/zones`, banners and
the spin wheel are under `/engagement`, announcements are `/broadcast`,
platform config is `/config`. Only teams, fee rules as a standalone resource,
and home-section ordering are genuinely absent.

**Checks updated.** `interactions.mjs` drives the real cancel flow instead of
the removed dropdown, and asserts the status column is no longer a control.

Verified: typecheck, lint across 69 files, build, and all seven suites passing.

### 2026-08-25 — Reference received, gap analysis written
- Added `docs/ADMIN-API-ENDPOINT-REFERENCE.md` as the API source of truth.
- Created this file.
- **Found:** eight console calls target routes that do not exist, and twelve
  features marked "no backend route" actually have one. Details in section 1.
- No code changed yet — the plan above is awaiting answers to the questions
  below before Phase 0 starts.
