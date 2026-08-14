# Backend Endpoint Requests — Admin Panel

## Status: most of the original list is resolved

Everything under "Blocking" and "High priority" in the original version of
this doc (menu items/approval queue, live rider locations, delivery zones,
generic vendor/rider profile editing, per-vendor commission, image upload,
admin user management) shipped in the backend's `INTEGRATION-ADMIN.md`
update and is now wired into the panel. Thank you.

What's below is new: findings from auditing the panel against
`infrastructure-overview.md` (2026-08-14, code-verified). Most of the panel
matches that doc cleanly — this is the list of what didn't, split into
"please confirm" (conflicts between sources) and "still open" (real gaps,
carried over from before).

---

## Please confirm — conflicting or incomplete documentation

### 1. Refresh token path: `/auth/refresh` vs `/auth/refresh-token`
`infrastructure-overview.md`'s admin-api endpoint table lists `POST
/refresh`. But your earlier message (the one that shipped the
`INTEGRATION-ADMIN.md` endpoints) explicitly said: *"the real refresh path
is `/auth/refresh-token`, not `/auth/refresh` (if you had it wrong, that's
on us — the old doc said the same)."*

The panel currently calls `/auth/refresh-token`, trusting the more specific
correction over the audit table (which lists `/refresh` identically across
all 4 apps, suggesting it may not have been re-verified per-app for this
one field). **Please confirm which is actually correct for admin-api** —
if the panel has this wrong, every session silently stops auto-refreshing
after the access token expires.

### 2. Rider `reject` and `verify-documents` — missing from the new endpoint table
The original `Admin API — Integration Reference` doc (with full
request/response JSON) documented both:
```
POST /riders/:riderId/reject            { reason }
POST /riders/:riderId/verify-documents  { decisions: [{ document_type, status, reason? }] }
```
`infrastructure-overview.md`'s rider table only lists `approve` and
`suspend` — no `reject`, no `verify-documents`. The vendor table, by
contrast, *does* still list `reject`. Riders missing the same action their
vendor counterpart has looks more like an incomplete table row than an
intentional removal (the endpoint tables in that doc aren't cited to
file:line the way the prose sections are).

The panel still calls both endpoints (rider rejection, and the two-document
verification flow in the rider detail modal). **Please confirm whether
these still exist** — if they were genuinely removed, that's real admin
capability lost (no way to reject a pending rider, no way to verify their
ID/license) and the panel needs a different flow, not just an endpoint
rename.

### 3. `GET /orders/search` — also missing from the new table
The original spec had `GET /orders/search?q=...` for the order-number
search box (`§5.4`). It's absent from `infrastructure-overview.md`'s orders
table (`GET /`, `GET /:orderId`, `GET /:orderId/timeline`, `POST
/:orderId/assign-rider`, `POST /:orderId/cancel` only). Same caveat as #2 —
possibly just an incomplete row. The panel still calls it for the search
bar in Order Management. Please confirm it's still live.

### 4. `POST /orders/:orderId/assign-rider` — request body shape unknown
This endpoint is confirmed real in the new doc (I'd previously assumed it
didn't exist and removed the UI for it — restored now). But I don't have
the request/response JSON for it, so I guessed `{ riderId }` (camelCase, to
match `commissionRate` from the vendor-commission endpoint). **Please
confirm the actual field name** and whether the response returns the
updated order (with `rider` populated) or just a status.

---

## Fixed this pass — frontend bugs, not backend asks

For visibility, since these were real bugs on our side, already corrected:

- **Phantom direct refund**: the order-cancel dialog had a "Refund the
  customer" checkbox that sent a `refund: true` flag to `POST
  /orders/:orderId/cancel`. Per your doc, no such capability exists on that
  endpoint — refunds only happen via `POST /disputes/:disputeId/resolve`.
  Removed the checkbox; the cancel dialog now says plainly that cancelling
  doesn't refund, and points admins to Disputes instead.
- **`/users/:userId/activate` → `/users/:userId/unsuspend`**: the panel was
  calling a made-up `/activate` path (from the original spec). Your table
  confirmed the real path is `/unsuspend`. Fixed.
- **Missing SuperAdmin gating on `/engagement/*` writes**: your doc says
  (and the very first spec said, under §13: *"SUPER_ADMIN required for
  writes"*) that all engagement mutations — banners, tracking facts,
  preference tags, loyalty rules/rewards, spin wheels, popups, vendor
  badges, menu-item upsell — require SuperAdmin. The panel had built these
  pages without that gate. Fixed across all of them: regular admins now see
  read-only views with a clear "Only a Super Admin can..." message instead
  of a raw 403 from a create/edit/delete action they shouldn't have been
  able to trigger in the first place.

One byproduct worth flagging: with that gating now correctly in place,
**a regular (non-super) admin genuinely cannot refund a customer at all**
if the order has no existing dispute — there's no direct refund endpoint,
and (per the endpoint table) creating a new dispute isn't an admin-api
capability either, only `POST /disputes/:disputeId/resolve` on an
already-existing one. If refunding orders without a pre-existing dispute is
supposed to be possible for admins, that's a product gap worth a look —
not something the frontend can work around.

---

## Still open from before

- **`GET /riders/:riderId/deliveries`** is confirmed real in the new doc
  but not yet used anywhere in the panel — would be a good parity addition
  to the rider detail modal (mirroring the vendor detail's "Recent Orders"
  section). Not wired up yet, just noting it's available.
- **`DELETE /users/:userId`** is a real endpoint per the new doc that the
  panel has never surfaced any UI for. Before adding a delete button:
  please confirm whether this is a soft delete (reversible, GDPR-style
  anonymization) or an actual hard delete — the UI treatment (confirmation
  copy, whether it's reversible) depends entirely on which.
- **Dispute status/category enum** — still only know `OPEN`/`RESOLVED` from
  examples; the filter dropdown is a guess.
- **`FRONTEND-INTEGRATION.md` / `FEATURE-FLAGS.md`** — referenced by the
  original spec, never received. May already answer #1 above and give the
  canonical feature-flag key list (the Feature Flags editor only shows
  whatever `GET /config/feature-flags` currently returns, so flags need to
  be seeded to be useful).
- **Customer behavior analytics, fleet-wide ops metrics (on-time %, CSAT),
  general discount/promo-code campaigns independent of Loyalty/Spin Wheel,
  app version gating, admin security policy config, chat/messaging** — no
  endpoints for any of these per either doc. Still not built into the
  panel; happy to if/when they exist.
