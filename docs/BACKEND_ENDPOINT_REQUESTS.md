# Backend Endpoint Requests — Admin Panel

## Status: everything from the last round is resolved or actioned

All open items from the previous audit have been confirmed and handled.
Summary of what changed in the panel as a result, then the two endpoints
that need rebuilding (with full request/response JSON so there's no
back-and-forth), then what's still genuinely open.

---

## Rebuild requests — full JSON included

### 1. Rider rejection + document verification
Confirmed genuinely gone (not a doc gap) — `rider-management.routes.ts`
only has `approve`, `suspend`, and generic `PATCH`. This is real lost admin
capability: no way to reject a pending rider application, no way to
review/approve-or-reject their KYC documents. The panel has removed the
dead calls (shows an amber "not available yet" note in the rider detail
modal instead of a raw 404) rather than rebuild against a guess.

Here's what these looked like the last time they existed, so you can
rebuild to the same contract (or tell us if you want to change it):

**`POST /riders/:riderId/reject`**
```jsonc
// Request
{ "reason": "Vehicle documents unclear" }

// Response 200 (same shape as vendor reject)
{
  "success": true,
  "data": { "id": "uuid", "status": "REJECTED", "rejection_reason": "Vehicle documents unclear" }
}
```

**`POST /riders/:riderId/verify-documents`**
```jsonc
// Request — one decision per document, submitted together or one at a time
{
  "decisions": [
    { "document_type": "NATIONAL_ID", "status": "APPROVED" },
    { "document_type": "DRIVERS_LICENSE", "status": "REJECTED", "reason": "Expired" }
  ]
}

// Response 200
{ "success": true, "data": { "riderId": "uuid", "documentsVerified": true } }
```
`document_type` values used by the old flow: `NATIONAL_ID`,
`DRIVERS_LICENSE`. If the rider record now tracks a different/expanded set
of document types, let us know and we'll adjust the UI options to match.

### 2. Order search
Confirmed genuinely gone — `order-management.routes.ts` has no search
route. Real gap; the panel's search box currently only filters the
already-loaded page (with a note telling the admin that), which is a poor
substitute for actually finding an order across the full dataset.

Requested contract, matching the pattern the rest of the API uses:
```
GET /orders/search?q=RY-CM-00012
```
- `q` — substring match against `order_number` (the format admins actually
  have on hand is the customer-facing order number, e.g. from a support
  chat, not the internal UUID)
- Response: array of orders in the same compact shape as `GET /orders`,
  ideally with the same `meta` pagination envelope if a query could ever
  match more than one page's worth

---

## Confirmed and actioned — no further backend work needed

- **Refresh path is `/auth/refresh`** (admin-api standardized to match the
  other 3 apps in commit `07786f7`; the earlier `/auth/refresh-token`
  guidance predated that change). Reverted.
- **`assign-rider` body confirmed `{ "riderId": "<uuid>" }`** — matches
  what the panel already sends, no change needed.
- **`DELETE /users/:userId` confirmed as soft delete** (sets
  `status = 'DELETED'`, anonymizes email/phone to
  `deleted_{id}@reeyo.local` / `deleted_{id}`). Added a Delete Account
  action to the customer detail modal with a type-DELETE-to-confirm step
  and copy that matches the real semantics — "deactivates the account and
  permanently removes contact info," explicitly not framed as a clean
  reversible toggle.
- **Dispute status enum confirmed `OPEN` / `RESOLVED` / `REJECTED`**.
  While wiring the status filter to match, noticed the endpoint table
  already lists `POST /disputes/:disputeId/reject` — this hadn't been
  wired into the panel at all (only `resolve` was). Added a Reject Dispute
  action alongside Resolve, posting `{ reason }`. **Please confirm that
  request body shape is right** — this one's a guess by pattern-matching
  the rest of the API, not from a confirmed source like #1 and #2 above.
- **Direct-refund gap confirmed real**, not a frontend misunderstanding —
  no `POST /orders/:orderId/refund`, and no admin-initiated
  "create a dispute" endpoint either, only `resolve` on a dispute that
  already exists (created by the customer via user-api). Not a code task;
  flagging again because it means **a regular admin genuinely cannot
  refund an order that has no pre-existing customer-filed dispute** —
  worth a product decision on your end about whether that's intended.

---

## Still open from before (unchanged)

- **`GET /riders/:riderId/deliveries`** confirmed real, not yet used
  anywhere in the panel — would be a good parity addition to the rider
  detail modal (mirroring the vendor detail's "Recent Orders" section).
- **`FRONTEND-INTEGRATION.md` / `FEATURE-FLAGS.md`** — still referenced by
  the original spec, never received.
- **Customer behavior analytics, fleet-wide ops metrics (on-time %, CSAT),
  general discount/promo-code campaigns independent of Loyalty/Spin Wheel,
  app version gating, admin security policy config, chat/messaging** — no
  endpoints for any of these. Not built into the panel; happy to if/when
  they exist.
