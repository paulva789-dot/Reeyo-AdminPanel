# Backend Endpoint Requests — Admin Panel

Compiled after wiring the full admin panel against `Admin API — Integration
Reference`. Everything the reference doc covers is now live in the panel.
This is what's left: features the panel has UI for for that the backend
doesn't support yet, plus a few structural gaps inside the existing spec.

Grouped by priority so the backend dev can triage.

---

## Blocking — panel is unusable in these areas without them

### 1. Menu items (list + CRUD + approval queue)
Nothing in the spec lets the admin panel see a vendor's menu at all. This
blocks two things:
- **Menu Approvals** page (`/users/vendors/approvals`) — currently pure
  mock data. Needs a pending-changes queue (new item / price update) with
  approve/reject.
- **`PATCH /engagement/menu-items/:itemId/upsell`** — this endpoint exists
  in the reference doc, but with no way to list menu items there's no way
  to get an `itemId` to call it with. It's dead on arrival without a list
  endpoint.

Requested:
```
GET  /vendors/:vendorId/menu-items          — list items + current status
GET  /menu-approvals?status=PENDING          — cross-vendor pending queue
POST /menu-approvals/:id/approve
POST /menu-approvals/:id/reject   { reason }
```

### 2. Rider live locations (bulk)
Rider detail (`GET /riders/:riderId`) returns `current_latitude`/
`current_longitude` for one rider, but Live Tracker needs all active
riders on a map at once. Polling per-rider doesn't scale.

Requested:
```
GET /riders/live-locations?country=CM   — [{ rider_id, name, lat, lng, status, current_order_id }]
```
(A websocket/SSE feed would be better than polling if that's on the table.)

### 3. Delivery zones (CRUD)
The Delivery Zones page has a polygon-drawing UI (`leaflet-draw` is
already a dependency) with nothing to save to. Needs zone geometry,
per-zone fee overrides referenced in `OperationalParameters`'s "Zone-specific
fee adjustments are managed in Logistics" note.

Requested:
```
GET    /logistics/zones
POST   /logistics/zones     { name, country_code, polygon: [[lat,lng],...], delivery_fee_override?, is_active }
PATCH  /logistics/zones/:id
DELETE /logistics/zones/:id
```

---

## High priority — real gaps in day-to-day admin ops

### 4. Generic vendor/rider profile editing
The spec only exposes `approve` / `reject` / `suspend` / `feature` (vendors)
and `approve` / `reject` / `suspend` / `verify-documents` (riders). There's
no way to fix a typo in a vendor's phone number or update a rider's vehicle
plate without one of those status-change actions.

Requested:
```
PATCH /vendors/:vendorId   { business_name?, phone?, email?, address?, ... }
PATCH /riders/:riderId     { name?, phone?, vehicle_plate?, vehicle_model?, ... }
```

### 5. Per-vendor commission override
`GET /vendors/:vendorId` returns a `commission_rate`, and `/config` sets
*global* `commission_rate_food` / `commission_rate_mart` — but there's no
endpoint to override commission for one specific vendor's contract, which
the original UI design assumed existed.

Requested:
```
PATCH /vendors/:vendorId/commission   { commission_rate }
```
(Could fold into #4's generic PATCH instead — backend's call.)

### 6. Image upload
Banners, popups, and vendor storefronts all take an `image_url` string.
Right now the admin has to host images somewhere else first and paste a
URL. A direct upload (or at least a presigned-URL flow) would remove that
friction.

Requested:
```
POST /uploads   (multipart) -> { url }
```
or
```
POST /uploads/presign   { filename, content_type } -> { uploadUrl, publicUrl }
```

### 7. Admin user management
`/auth/me` and `/auth/change-password` only cover the logged-in admin's own
account. There's no way to list other admins, invite one, change someone's
role, or suspend an admin account — a real gap for a multi-admin team.

Requested:
```
GET    /admin-users
POST   /admin-users           { email, name, role }   — invite
PATCH  /admin-users/:id       { role?, status? }
DELETE /admin-users/:id
```

---

## Needs clarification, not new endpoints

### 8. Cookie auth details
The integration checklist says store tokens in **HTTP-only cookies**, but
`POST /auth/login` and `POST /auth/refresh` both also return the tokens in
the JSON response body — which only makes sense for a mobile client
reading them directly. For the admin panel specifically, please confirm:
- Does `/auth/login` set `Set-Cookie` for `accessToken`/`refreshToken`?
- What `SameSite`/`Secure` attributes, given the admin panel and
  `admin-api` may be on different subdomains in production?
- Is CORS configured with `Access-Control-Allow-Credentials: true` and an
  explicit allowed origin (not `*`) for the admin panel's domain?

We built the client assuming yes to all three (`credentials: 'include'`,
refresh-on-401 via cookie) — if that's wrong, the auth flow needs rework.

### 9. Dispute status/category enum
Only `OPEN` and `RESOLVED` appear in the reference doc's examples. What's
the full `status` enum (e.g. is there an `IN_PROGRESS`?) and the full
`category` enum? The panel's filter dropdown is currently guessing.

### 10. Referenced-but-missing docs
The reference doc links to `FRONTEND-INTEGRATION.md` and
`FEATURE-FLAGS.md` as separate files. We don't have either — if they exist,
please send them; they may already answer #8 and give the canonical list
of feature flag keys (right now the Feature Flags editor just shows
whatever `GET /config/feature-flags` returns, so flags need to be seeded
for it to be useful).

---

## Nice to have — dropped from the panel, can restore if endpoints show up

- **Customer behavior analytics** (new customers, activation rate, referral
  rate, cart abandonment) — no endpoint, was removed from the Analytics
  page rather than faked.
- **Fleet-wide ops metrics** (on-time %, avg prep time across all vendors,
  CSAT) — only per-rider (`/analytics/riders`) and per-vendor
  (`average_prep_time` field) numbers exist today, nothing aggregated.
- **General discount/promo-code campaigns** ("15% off all orders this
  weekend", applied at checkout) — the closest things that exist are
  Loyalty Rewards (redeemed with points) and Spin Wheel segments (won by
  chance). If you want a real promo-code system independent of both,
  that's a new resource.
- **App version gating** (min/latest version per client app) — no
  endpoint; `AppVersionControl.jsx` is still local-only mock state.
- **Security policy config** (password rules, 2FA requirement) — no
  endpoint.
- **Chat/messaging** — no endpoints at all in the reference doc. If this
  is meant to be real-time support chat, it likely needs its own service
  (websocket) rather than fitting the REST pattern here.

---

## Already fine, just flagging for awareness
- `min_payout` in `/config` is keyed by currency (`XAF`, `NGN`, `KES`,
  `GHS`) — confirmed working, no action needed.
- Payout `entity_name` in `/payouts/pending` and `/payouts/history` isn't
  guaranteed present in every example — worth double-checking it's always
  populated, since the UI falls back to raw `vendor_id`/`rider_id` when
  it's missing.
