# Dev log — reeyo Operations Console

Running record of what is built, what is not, and every change made against the
verified API. **Updated on every change**, newest entry at the top of the log.

- Source of truth for the API: [`docs/ADMIN-API-ENDPOINT-REFERENCE.md`](docs/ADMIN-API-ENDPOINT-REFERENCE.md)
- Design spec: [`CLAUDE.md`](CLAUDE.md)
- History of how the console got here: [`audit/session-log.md`](audit/session-log.md)

---

## 1. Where the console stands today

> **All nine phases are complete as of 2026-08-25.** Section 1 below is the gap
> analysis written when the reference arrived, kept as the record of what was
> wrong and why. Section 3 is what was done about it, newest first.

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

### Phase 1 — Role awareness ✅ **done 2026-08-25**
A large part of the API is SuperAdmin-only. The console currently shows those
controls to everyone and lets the request 403 in silence.

- Read `role` from `/auth/me`, expose `isSuperAdmin`
- Gate API keys, feature flags, admin users, and every engagement write
- Show a clear "needs Super Admin" state rather than a dead button

### Phase 2 — Approval queues ✅ **done 2026-08-25**
Vendors and riders waiting on a decision, with the KYC review the old panel lost.

- Vendor approvals: approve / reject with reason / suspend
- Rider approvals: approve / reject / suspend
- Rider document verification against the five real document types
- Badges on the rail, consistent with Orders and Disputes

### Phase 3 — Real analytics ✅ **done 2026-08-25**
Replace the derived-and-gated figures with the six analytics endpoints, and use
`/analytics/live` for the Overview's live rail.

### Phase 4 — Delivery zones for real ✅ **done 2026-08-25**
`/logistics/zones` with polygon CRUD. This is the one place the console needs a
map drawing surface; the spec forbids a chart library but says nothing about
maps, so **this needs a decision from you** — see the questions below.

### Phase 5 — Engagement suite ✅ **done 2026-08-25**
Banners, popups, spin wheels, loyalty rules and rewards, preference tags,
tracking facts, shared carts, badges and upsell. Replaces most of what
Marketing and Storefront currently fake, and needs `/uploads` for images.

### Phase 6 — Broadcast ✅ **done 2026-08-25**
Turn the Announcements composer into real push via `/broadcast/*`, with the
audience picker mapping to the three real routes.

### Phase 7 — Detail views ✅ **done 2026-08-25**
`/orders/:id/timeline`, `/users/:id/orders`, `/vendors/:id/orders`,
`/vendors/:id/menu-items`, `/riders/:id/deliveries`. Fills the drawers with real
history instead of derived summaries.

### Phase 8 — Admin users and platform config ✅ **done 2026-08-25**
`/admin-users` CRUD and `PATCH /config`, both SuperAdmin.

---

## 3. Change log

Newest first. Every entry names what changed and why.

### 2026-08-25 — Sign-in was broken in dev and in production, for different reasons

Reported as "login not working". It was three separate defects.

**1. Dev pointed at a backend nobody was running.** `VITE_PROXY_TARGET`
defaulted to `http://localhost:3005`. Unless you happened to have admin-api
running locally, every request hit a refused connection, which Vite turns into
a bare `500` with a plain-text body. The default is now the deployed API, which
is the one that is actually up; set `VITE_PROXY_TARGET` to localhost to work
against a local one. Signing in with a wrong password now returns a real
`401 AUTH_TOKEN_INVALID` instead of a 500.

**2. The console blamed the backend for that 500.** `apiClient` fell back to
`response.statusText` when a body would not parse, so Vite's proxy failure
reached the screen as "Internal Server Error" — indistinguishable from the API
rejecting the sign-in, and it sends anyone debugging it to the wrong place. A
failure that is not in the API's envelope did not come from the API, and now
says so.

**3. Production 404'd on every deep link.** No SPA fallback was configured, so
`/orders` — or a refresh anywhere but `/` — returned Vercel's NOT_FOUND.
`frontend/vercel.json` adds the fallback, and also rewrites `/api/v1/*` to the
API so the browser sees a single origin. Deep links are fixed and verified.

**Still failing: production sign-in.** The deployed API keeps an
`ALLOWED_ORIGINS` allowlist and answers **500 with no CORS headers** — not a
clean rejection — for any origin outside it. Measured:

| Origin | Result |
|---|---|
| *(none — a server-side client)* | `401` + correct envelope |
| `https://usereeyo.com` | `401` + `access-control-allow-origin` |
| `https://admin.usereeyo.com` | `401` + `access-control-allow-origin` |
| `https://www.usereeyo.com` | **500**, no CORS headers |
| `http://localhost:5173` | **500**, no CORS headers |
| `https://reeyo-admin-panel-rho.vercel.app` | **500**, no CORS headers |

The Vercel rewrite does not fix this on its own: Vercel forwards the browser's
`Origin` header unchanged, and browsers send `Origin` on same-origin POSTs too.

**Resolved by moving the console onto an origin that is already trusted.**
`admin.usereeyo.com` was allowlisted by the backend all along but had no DNS
record — the intended home for this console, never set up. It is now added to
the Vercel project, so the only outstanding step is one DNS record:

```
A    admin    76.76.21.21
```

on `usereeyo.com` (nameservers are `ns1/ns2.dns-parking.com`, so this is added
wherever that zone is managed). Nothing changes on the backend, and no origin
allowlist is bypassed — the console simply moves to the address that was meant
for it.

One thing that cannot be verified without a working sign-in: the auth cookie's
`Domain` attribute. The `/api/v1` rewrite means the browser receives the
cookie from `admin.usereeyo.com` rather than `admin-api.usereeyo.com`, which is
fine if the cookie is host-only or scoped to `.usereeyo.com`, and fails if the
backend pins it to `Domain=admin-api.usereeyo.com`. If sign-in appears to
succeed and then immediately bounces back to the login screen, that is this,
and the fix is a one-line change: point `VITE_API_BASE_URL` at
`https://admin-api.usereeyo.com/api/v1` and let the browser call it directly —
which works from `admin.usereeyo.com` because that origin is allowlisted and
the two hosts are same-site.

**Check hardened.** `auth.mjs` had a check that passed on the broken state: it
asserted "a request was made" and "an error appeared", both of which a proxy
500 satisfies. That is how a completely dead sign-in stayed green. It now
asserts the API itself answered `401`, and that the message shown reads as a
credentials problem rather than an infrastructure failure.

### 2026-08-25 — Phase 8: Settings stops being a mock-up

`state/usePlatformAdmin.ts` loads `/config`, `/config/feature-flags` and
`/admin-users` together; each card reports its own failure.

- **Commission and fees** read from `/config` and save with `PATCH /config`.
  Save and Discard only light up when something actually changed, and every
  field is validated before the request.
- **Platform switches** were five hard-coded toggles wired to nothing. They are
  now whatever `/config/feature-flags` returns — including flags this console
  has never heard of, which render from their key.
- **Admin team** is real CRUD on `/admin-users`: invite, promote or demote,
  suspend or reinstate, remove. Two guards: the row for the signed-in account
  offers no actions at all, because demoting or suspending yourself would lock
  the console with no way back; and inviting a Super Admin says out loud what
  that role can do, including changing your own account.
- **Payment methods** is the only card left with no endpoint, and keeps its
  `LocalOnly` notice.

**The page-level "Save changes" button is gone.** It could not honestly say
which of three separate endpoints it wrote to, or which one failed. Saving is
now per card.

All three write paths are SuperAdmin. A plain admin sees the figures and the
flag states with a badge saying whose call a change is — and, for admin
accounts, an explanation instead of a seeded team that would read as the real
one, since the API will not even let them read the list.

**Checks updated.** Two suites asserted behaviour that was deliberately
removed: banner reordering (no position field exists on
`/engagement/banners`, so the drag handle was a control that saved nothing) and
zones grouped by region (that view is now the Capacity tab; Zones is the real
map editor). `interactions.mjs` now asserts the banner CRUD that replaced it,
that no reorder control remains, and three things about the rider approval
queue — including that Approve stays disabled until every document is reviewed.

Verified: typecheck, lint, production build, and all seven check suites passing.

### 2026-08-25 — Phase 7: detail views, and three buttons that were lying

`state/useDetail.ts` loads a detail resource when a drawer opens rather than
with the page — a customer's history is worth a request when someone asks for
it and worth nothing while they scan two hundred rows.

- **Order timeline** (`/orders/:id/timeline`). `components/domain/OrderTimeline`
  shows what the platform recorded, with times and notes. When there is no
  recorded timeline it falls back to the five fixed stages **and says which of
  the two you are reading** — presenting a derived guess as a recorded history
  is the one thing that block must never do.
- **Vendor drawer** — recent orders from `/vendors/:id/orders`.
- **Vendor menu** (`/vendors/:id/menu-items`) — the modal used to say "the admin
  API has no menu route", which stopped being true. In live mode it now reads
  the real items. It is read-only, because the API offers no write: a vendor
  edits their own menu, and price changes arrive here as menu approvals.
- **Customer drawer** — new. Order history from `/users/:id/orders`, plus
  suspend, reinstate and delete against the real routes. `/users` returns no
  suspension state, so the drawer says it cannot show whether someone is
  currently suspended rather than guessing.
- **Rider drawer** — new. Deliveries from `/riders/:id/deliveries`, plus suspend.

`OrderHistory` is shared by all three. When the endpoint answers it shows the
full history; when it cannot it falls back to the orders already loaded into
the console and says that is a fragment, not the whole story.

**Three controls that did nothing are gone.** "Release payout" on the vendor
drawer and on every rider row only ever fired a toast — money moves through the
payouts queue and no vendor- or rider-level route releases anything. The rider
one became **Deliveries**, which opens something real. "Suspend" on the vendor
drawer now asks for a reason and calls `POST /vendors/:id/suspend`, and updates
the vendor list as well as the approval queue, since suspension reaches a vendor
from both places.

Verified: typecheck and lint clean.

### 2026-08-25 — Phases 5 and 6: the engagement suite and real push

`state/useEngagement.ts` loads the eight engagement collections, taking a list
of which ones the page needs — Marketing asks for spin wheels alone rather than
firing eight requests to show the Offers tab.

**Storefront** became the engagement page: Banners, Popups, Loyalty, Audience,
Sections.

- **Banners** (`/engagement/banners`) — full CRUD against the real route,
  replacing the drag-to-reorder list that saved nothing. Ordering went with it:
  the API exposes no position field, so a drag handle would have been a control
  that does nothing.
- **Popups** (`/engagement/popups`) — full CRUD, with impressions, taps and the
  rate between them, which is the only figure that says whether a popup earns
  the interruption.
- **Loyalty** (`/engagement/loyalty/*`) — reads live, deliberately read-only.
  The API has POST and DELETE on a rule but no PATCH, so editing one would mean
  deleting and recreating it under a new id and taking every balance keyed to
  the old one with it. The panel says exactly that rather than hiding the gap.
- **Audience** — preference tags, tracking-screen facts and open shared carts,
  all read-only, all real routes.
- **Sections** is the only thing left on the page with no endpoint. It keeps a
  `LocalOnly` notice, and that notice is now true.

**Images.** `components/ui/ImageField.tsx` uploads through `POST /uploads`
(multipart, field `image`) and stores the returned URL. Type and size are
checked before the request so a rejection is instant. In sample mode it says
there is nowhere to upload to instead of pretending the file went somewhere.

**Spin wheel** (`/engagement/spin-wheels`) now draws the real segments — the
hand-rolled SVG wheel stayed, its weights are no longer seeded, and slice
colour comes from the segment's reward type. Segments are read-only, which the
panel names.

**Every engagement write is SuperAdmin.** `WriteGate` shows a plain admin a
badge saying whose call it is, instead of a button that would 403 in silence.

**Broadcast** replaced the fake announcements composer. `POST /broadcast/users`
`/vendors` `/riders`, audience chosen by segmented control. Two deliberate
choices:

- **A confirmation step.** A push reaches every device at once and cannot be
  recalled, so the console shows the notification as it will arrive and says so
  before sending.
- **No fake history.** The old screen listed sent announcements with reach and
  open rates; no endpoint returns any of that. The panel now lists only what
  was sent from this session, and says plainly that is all it can know.

Verified: typecheck and lint clean.

### 2026-08-25 — Phase 4: delivery zones on a real map

`/logistics/zones` is now wired end to end — list, create, rename, fee
override, activate, delete — with Leaflet drawing the boundaries.

**Why a map library at all.** A zone is a polygon in world coordinates. The
spec forbids chart and component libraries, and every chart in the console is
still hand-rolled SVG, but no amount of hand-rolled SVG tells an admin whether
a boundary covers the streets they mean. Leaflet is the only dependency added,
and it is confined to `components/domain/ZoneMap.tsx`.

- **Drawing** is hand-rolled rather than pulling in `leaflet-draw`: clicking
  the map appends a vertex, the draft renders as a dashed polygon with a marked
  first point, and Undo point walks it back. Save is disabled below three
  points, which is what the API requires and what it takes to enclose anything.
- **Colours** come out of `tokens.css` through `getComputedStyle`, so the map
  obeys §14 like everything else. Inactive zones draw muted and dashed — they
  exist, they are just not serving.
- **Leaflet's z-index** would have put tiles and zoom controls above the drawer
  and the modal. `.reeyo-map` pulls every pane it creates back below them.
- **Vertices use `circleMarker`**, not markers, which sidesteps Leaflet's
  broken default icon paths under a bundler — no image assets involved.
- **The tab is lazy-loaded.** Leaflet was a third of the bundle; it now loads
  when someone opens Dispatch → Zones. Main bundle went 537 kB → 378 kB.

The seeded capacity cards that used to occupy this tab were not zones in the
API's sense at all — they are rider load per area, which has no endpoint. They
moved to a **Capacity** tab, still marked local-only, and the `LocalOnly`
notice on them no longer claims `/logistics/zones` as its missing route.

Verified: typecheck, lint, and a production build.

### 2026-08-25 — Phase 3: analytics comes off the derived figures

`state/useAnalytics.ts` loads the six analytics endpoints, each independently —
one failing must not blank the other five — and takes a list of which ones the
calling page actually needs, so Overview makes one request for its live card
rather than six for a card that uses one.

- **Analytics page.** Gross value, average basket, order count, customer count,
  rider count and cancel rate now come from `/analytics/platform` when it
  answers. `/analytics/revenue` replaced the seeded 30-day column chart with a
  real series, `/analytics/top-vendors` and `/analytics/top-riders` replaced the
  locally-ranked lists, and `/analytics/order-status` gives the status donut.
- **Overview.** A "Right now" card from `/analytics/live` — active orders,
  riders online, vendors open, orders and revenue today, approvals waiting. It
  appears only in live mode, because there is nothing to snapshot in sample
  mode.

**One thing worth being explicit about.** None of these endpoints take a region
parameter, so every figure they return covers all ten regions no matter what
the topbar filter says. Rather than let the filter appear to have produced a
national total, each tab carries a `SourceNote` that names where its numbers
came from and, when a region is selected, says plainly that these particular
figures ignore it. The "Right now" card says `platform-wide, all regions` for
the same reason.

`SeriesCard` handles the three states a chart with a real endpoint can be in —
loading, failed, empty — and falls back to a locally derived equivalent only in
sample mode. Two new helpers in `lib/insights.ts` (`orderStatusCounts`,
`topRidersByTrips`) provide those fallbacks from rows already on screen, so the
sample view is derived rather than invented.

Verified: typecheck and lint clean.

### 2026-08-25 — Phase 2: vendor and rider approval queues, with KYC review

Approvals stops being one menu queue and becomes the page where anything asking
to get onto the platform is decided. Three tabs — Menu changes, Vendors,
Riders — each with its own status filter, and the rail badge now adds up all
three rather than counting menus alone.

- **Vendors** (`GET /vendors`, `POST /vendors/:id/approve|reject|suspend`).
  Approve, reject with a reason, and suspend a vendor already trading. Suspend
  only appears on an approved row, because that is the only state where taking
  someone offline is the act that makes sense.
- **Riders** (`GET /riders`, `POST /riders/:id/approve|reject`). Same shape,
  plus a documents column showing how far through KYC each applicant is.
- **KYC review** (`POST /riders/:id/verify-documents`). A modal over the five
  real document types, accept or refuse each, refusals carry a reason. Two
  things the reference forced:
  - Recording decisions **does not** approve the rider — the API is explicit
    that approval is a separate call. The modal says so, and Approve on the
    queue row stays disabled until every document has been reviewed.
  - `adaptRiderDocuments` always returns all five types, so a document the
    rider never uploaded shows as **not submitted** rather than vanishing from
    the list. Those rows cannot be accepted, only refused.

**Structure.** `pages/Approvals.tsx` is now a shell; the queues live in
`pages/approvals/` alongside a shared `ReasonModal` (three rejection flows, one
component) and `riderDocs.ts` for the labels and progress helper — a plain
module so the component files keep their Fast Refresh boundary.

**State.** `AppState` gained both queues with region scoping (applicants carry
their own region, so they scope directly rather than inheriting one) and six
write-through actions. Sample rows in `data/approvalSeed.ts` include a
part-reviewed rider and one with a missing insurance upload, so both edge cases
are reachable without a live session.

Verified: typecheck and lint clean.

### 2026-08-25 — Phase 1: the console knows what your account may do

`/auth/me` returns a role, which the console had been ignoring. `useAuth` now
exposes `role` and `isSuperAdmin`, and `components/ui/SuperAdminOnly.tsx`
carries the two shapes that gating takes: a panel-sized state naming the role
needed and who to ask, and an inline badge for a single control.

API keys were the first thing gated — the whole resource is SuperAdmin, so a
plain admin was being shown a create form whose request could only 403. Every
phase after this one gates its own writes the same way.

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
