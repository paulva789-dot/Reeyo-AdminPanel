# Admin API — Complete Endpoint Reference

> Supplied by the backend team, verified 2026-08-21 against the live deployment
> and the actual route/controller/service source. **This is the source of truth.**
> Where this and any other document in this repo disagree, this one wins — see
> `DEV-LOG.md` for the corrections it forced on the console.

## Base URL & connectivity — the 404 diagnosis

**Confirmed live:** `https://admin-api.usereeyo.com/api/v1`

```
GET https://admin-api.usereeyo.com/health → 200
{
  "status": "healthy",
  "service": "admin-api",
  "version": "1.0.0",
  "dependencies": { "postgres": "ok", "redis": "ok" }
}
```

Note: `/health` is **not** under `/api/v1` — it is mounted at the app root.
`https://admin-api.usereeyo.com/api/v1/health` 404s; the bare
`https://admin-api.usereeyo.com/health` is correct. Every other endpoint below
**is** under `/api/v1`.

**Set the frontend's `VITE_API_BASE_URL` to:** `https://admin-api.usereeyo.com/api/v1`

**CORS**: admin-api's CORS config (`app.ts`) is origin-allowlist +
`credentials: true`, driven by the `ALLOWED_ORIGINS` env var. The `.env` in the
backend repo only has `localhost:3000,localhost:3001` — that is the local dev
config, not what is set on the live deployment. **Someone with access to the
hosting platform needs to confirm `ALLOWED_ORIGINS` on the live instance
includes the admin panel's exact deployed origin.** If it does not, login fails
with a silent CORS block.

## Auth

Cookie-based (httpOnly) **and** Bearer token — `authenticateAdmin` checks the
`Authorization` header first, falls back to the cookie. The admin panel uses
`credentials: 'include'`, matching the cookie path.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public | `{ email, password }` → sets cookie + returns token pair |
| POST | `/auth/refresh` | Public | `{ refreshToken }` (or cookie) |
| GET | `/auth/me` | Auth | |
| POST | `/auth/logout` | Auth | |
| POST | `/auth/change-password` | Auth | `{ currentPassword, newPassword }` |

## Users

| Method | Path | Auth |
|---|---|---|
| GET | `/users` | Auth |
| GET | `/users/:userId` | Auth |
| GET | `/users/:userId/orders` | Auth |
| POST | `/users/:userId/suspend` | Auth — `{ reason }` |
| POST | `/users/:userId/unsuspend` | Auth |
| DELETE | `/users/:userId` | Auth — **soft delete**: sets `status='DELETED'`, anonymizes email/phone to `deleted_{id}@reeyo.local` / `deleted_{id}`. Row persists, contact info is destroyed and not recoverable. |

## Vendors

| Method | Path | Auth |
|---|---|---|
| GET | `/vendors` | Auth |
| GET | `/vendors/:vendorId` | Auth |
| GET | `/vendors/:vendorId/orders` | Auth |
| GET | `/vendors/:vendorId/menu-items` | Auth |
| POST | `/vendors/:vendorId/approve` | Auth |
| POST | `/vendors/:vendorId/reject` | Auth — `{ reason }` |
| POST | `/vendors/:vendorId/suspend` | Auth — `{ reason }` |
| PATCH | `/vendors/:vendorId/feature` | Auth — `{ featured: boolean }` |
| PATCH | `/vendors/:vendorId` | Auth — generic profile edit (`businessName`, `ownerName`, `phone`, `email`, `address`, `city`, `description`, `mobileMoneyNumber`, `mobileMoneyProvider`, `bankName`, `bankAccountNumber`, `bankAccountName`, all optional) |
| PATCH | `/vendors/:vendorId/commission` | Auth — `{ commissionRate: 0–1 }` |

## Riders

| Method | Path | Auth |
|---|---|---|
| GET | `/riders` | Auth |
| GET | `/riders/live-locations` | Auth — `?country=` optional |
| GET | `/riders/:riderId` | Auth |
| GET | `/riders/:riderId/deliveries` | Auth |
| POST | `/riders/:riderId/approve` | Auth |
| POST | `/riders/:riderId/reject` | Auth — `{ reason }` |
| POST | `/riders/:riderId/verify-documents` | Auth — `{ decisions: [{ document_type: "NATIONAL_ID"\|"DRIVERS_LICENSE"\|"VEHICLE_REGISTRATION"\|"PROFILE_PHOTO"\|"INSURANCE", status: "APPROVED"\|"REJECTED", reason?: string }] }`. Does **not** change the rider's overall approval status — that is still a separate `approve`/`reject` call once all documents are reviewed. |
| POST | `/riders/:riderId/suspend` | Auth — `{ reason }` |
| PATCH | `/riders/:riderId` | Auth — generic profile edit (`firstName`, `lastName`, `phone`, `email`, `vehicleType`, `vehiclePlate`, all optional) |

## Orders

| Method | Path | Auth |
|---|---|---|
| GET | `/orders` | Auth — filters: `status`, `vendorId`, `riderId`, `userId`, `dateFrom`, `dateTo`, `page`, `limit` |
| GET | `/orders/search?q=` | Auth — order-number substring match (ILIKE), same response shape as the list endpoint |
| GET | `/orders/:orderId` | Auth |
| GET | `/orders/:orderId/timeline` | Auth |
| POST | `/orders/:orderId/assign-rider` | Auth — `{ riderId: "<uuid>" }` (camelCase, confirmed) |
| POST | `/orders/:orderId/cancel` | Auth — `{ reason }` |

**No direct refund endpoint exists.** Refunds only happen via
`POST /disputes/:disputeId/resolve` on an already-existing dispute — there is no
way to create a dispute from admin-api, only to act on one a customer filed.

**There is no generic order status update.** `cancel` and `assign-rider` are the
only writes.

## Analytics

| Method | Path | Auth |
|---|---|---|
| GET | `/analytics/platform` | Auth |
| GET | `/analytics/revenue` | Auth |
| GET | `/analytics/top-vendors` | Auth |
| GET | `/analytics/top-riders` | Auth |
| GET | `/analytics/order-status` | Auth |
| GET | `/analytics/live` | Auth — dashboard polling snapshot (active orders, online riders/vendors, today's orders/revenue, pending approvals) |

## Config

| Method | Path | Auth |
|---|---|---|
| GET | `/config` | Auth |
| GET | `/config/commission-rate` | Auth |
| PATCH | `/config` | **SuperAdmin** |
| GET | `/config/feature-flags` | Auth |
| PATCH | `/config/feature-flags/:key` | **SuperAdmin** |
| DELETE | `/config/feature-flags/:key` | **SuperAdmin** |
| GET | `/config/api-keys` | **SuperAdmin** |
| POST | `/config/api-keys` | **SuperAdmin** |
| DELETE | `/config/api-keys/:id` | **SuperAdmin** |

## Disputes

| Method | Path | Auth |
|---|---|---|
| GET | `/disputes` | Auth |
| GET | `/disputes/:disputeId` | Auth |
| POST | `/disputes/:disputeId/resolve` | Auth — `{ resolution, refundAmount? }`. Credits `user_wallets` if `refundAmount` given. |
| POST | `/disputes/:disputeId/reject` | Auth — `{ reason }` |

Status enum (no DB constraint, but only these 3 values are ever written):
`OPEN` (default) / `RESOLVED` / `REJECTED`.

**There is no dispute messages endpoint.**

## Payouts

| Method | Path | Auth |
|---|---|---|
| GET | `/payouts/pending?type=VENDOR\|RIDER` | Auth |
| GET | `/payouts/history` | Auth |
| POST | `/payouts/:payoutId/approve` | Auth — `{ type: "VENDOR"\|"RIDER" }` |
| POST | `/payouts/:payoutId/reject` | Auth — `{ type: "VENDOR"\|"RIDER", reason }` |
| POST | `/payouts/webhooks/campay` | **Public** — HMAC-signature verified |
| POST | `/payouts/webhooks/notchpay` | **Public** — HMAC-signature verified |
| POST | `/payouts/webhooks/mpesa` | **Public** — Safaricom IP-allowlisted, no signature |
| POST | `/payouts/webhooks/mpesa/timeout` | **Public** |

## Broadcast (push notifications)

| Method | Path | Auth |
|---|---|---|
| POST | `/broadcast/users` | Auth — `{ title, body, data?, userIds? }` (omit `userIds` = all users) |
| POST | `/broadcast/vendors` | Auth — `{ title, body, data?, vendorIds? }` |
| POST | `/broadcast/riders` | Auth — `{ title, body, data?, riderIds? }` |

## Engagement — reads open to any admin, writes SuperAdmin-only

| Method | Path | Auth |
|---|---|---|
| GET/POST/PATCH/DELETE | `/engagement/banners[/:id]` | Auth read, SuperAdmin write |
| GET/POST/PATCH/DELETE | `/engagement/tracking-facts[/:id]` | Auth read, SuperAdmin write |
| GET/POST/DELETE | `/engagement/preference-tags[/:tag]` | Auth read, SuperAdmin write |
| GET/POST/DELETE | `/engagement/loyalty/rules[/:id]` | Auth read, SuperAdmin write |
| GET/POST/PATCH/DELETE | `/engagement/loyalty/rewards[/:id]` | Auth read, SuperAdmin write |
| GET | `/engagement/loyalty/accounts/:userId[/ledger]` | Auth |
| GET/POST/PATCH/DELETE | `/engagement/spin-wheels[/:id]`, `/spin-wheels/:id/segments[/:segmentId]`, `/spin-wheels/:id/results` | Auth read, SuperAdmin write |
| GET/POST/PATCH/DELETE | `/engagement/popups[/:id]`, `/popups/:id/stats` | Auth read, SuperAdmin write |
| GET | `/engagement/shared-carts` | Auth |
| PATCH | `/engagement/vendors/:vendorId/badges` | **SuperAdmin** — `{ badges: string[] }`. Separate from the vendor-toggleable `is_high_demand` field. |
| PATCH | `/engagement/menu-items/:itemId/upsell` | **SuperAdmin** — `{ is_upsell: boolean }` |

## Menu Approvals

| Method | Path | Auth |
|---|---|---|
| GET | `/menu-approvals?status=` | Auth |
| POST | `/menu-approvals/:requestId/approve` | Auth |
| POST | `/menu-approvals/:requestId/reject` | Auth — `{ reason }` |

## Admin Users (managing other admins)

| Method | Path | Auth |
|---|---|---|
| GET | `/admin-users` | **SuperAdmin** |
| POST | `/admin-users` | **SuperAdmin** — `{ email, name, role: "ADMIN"\|"SUPER_ADMIN" }` |
| PATCH | `/admin-users/:adminId` | **SuperAdmin** — `{ role?, status?: "ACTIVE"\|"SUSPENDED" }` |
| DELETE | `/admin-users/:adminId` | **SuperAdmin** |

## Uploads

| Method | Path | Auth |
|---|---|---|
| POST | `/uploads` | Auth — multipart, field `image`, max 5MB, jpeg/png/webp. Returns `{ url, key }` — paste `url` into any `image_url` field. |

## Logistics / Delivery Zones

| Method | Path | Auth |
|---|---|---|
| GET | `/logistics/zones` | Auth |
| GET | `/logistics/zones/:zoneId` | Auth |
| POST | `/logistics/zones` | Auth — `{ name, countryCode, polygon: [[lat,lng], ...] (min 3), deliveryFeeOverride?, isActive? }` |
| PATCH | `/logistics/zones/:zoneId` | Auth |
| DELETE | `/logistics/zones/:zoneId` | Auth |

---

## Cross-cutting notes

- **`vendors.is_high_demand`** — vendor-toggleable from their own dashboard
  (`PATCH /profile` on vendor-api, not admin-api). Distinct from the admin-only
  `badges` array above.
- **`average_rating` on vendors/riders is now always a JSON number**, not a
  string — a systemic node-pg NUMERIC-as-string bug, fixed globally. Any
  `Number(x)` / `parseFloat` workaround around this field is now a harmless
  no-op and can be removed.
- Swagger (`/api-docs`, non-production only) is known to be stale relative to
  this list; if the two disagree, trust this document and flag the drift.
