# reeyo — Operations Console

Build specification for Claude Code. This file lives at the repository root as `CLAUDE.md`.

---

## 0. Start here

You are building the **reeyo admin operations console**: the internal tool the reeyo team uses to run a multi-service delivery platform across Buea, Cameroon. Three verticals share one platform — **Food**, **Grocery**, **Parcel**.

The audience is a platform admin who opens this tool at 07:00 and needs to know, in under five seconds, what is broken and what needs releasing. Every decision below serves that.

**First command to run in a fresh session:**

> Read CLAUDE.md fully, then build Phase 1 only. Stop and show me before starting Phase 2.

---

## 1. Stack and constraints

| Decision | Value |
|---|---|
| Framework | React 18 + TypeScript, Vite |
| Styling | Tailwind CSS v4 with CSS custom properties as the token source |
| Routing | React Router (`/`, `/orders`, `/dispatch`, `/vendors`, `/riders`, `/customers`, `/storefront`, `/marketing`, `/payments`, `/analytics`, `/settings`) |
| State | React state and context only. No Redux, no Zustand |
| Data | Local TypeScript seed files. No backend, no API calls |
| Icons | Inline SVG components written by hand. No icon library |
| Charts | Hand-rolled SVG. **No Recharts, no Chart.js, no D3** |
| Fonts | Plus Jakarta Sans (400–800) + IBM Plex Mono (400–600), loaded from Google Fonts |

### Hard rules

- **No component library.** No shadcn, no MUI, no Ant Design, no Headless UI. Every component is written from the specs in section 5.
- **No hard-coded colour values in components.** Every colour resolves to a token from section 3. If you need a colour that is not in the token list, stop and ask.
- **No emoji anywhere in the interface.** Not in navigation, not in headings, not in empty states.
- **No `localStorage` or `sessionStorage`.** All state is in memory.
- **No placeholder text like "Lorem ipsum" or "Coming soon."** Every screen is fully populated with realistic seed data.
- Currency is **FCFA**, always. Thousands separate with a thin space: `2 140 000`, never `2,140,000`.

---

## 2. What the product is

reeyo connects customers in Buea with local restaurants, grocery stores and instant parcel couriers. The console manages:

- Orders moving through seven stages across three verticals
- A rider fleet working defined zones
- Vendors who publish menus and get settled weekly
- Money: what came in, what the platform earned, what is owed and to whom
- Storefront merchandising and marketing campaigns

**Zones:** Molyko, Bonduma, Great Soppo, Mile 16, Muea.
**Payment methods:** MTN Mobile Money, Orange Money, cash on delivery, card, bank transfer.

---

## 3. Design tokens

Put this in `src/styles/tokens.css` and import it before anything else. These come from the reeyo Brand & UI Guide v1.1.

```css
:root{
  /* Brand core — from Brand Guide v1.0, do not alter */
  --forest:#063831;      /* primary anchor: nav, headings, secondary command buttons */
  --emerald:#00BF63;     /* brand action: CTA fills, live dots, active markers */
  --mint:#9EE8B8;        /* secondary accent: borders, gradient stops, eyebrows on dark */
  --pastel:#BFF5D1;      /* light surface: soft buttons, banner gradients, tile borders */
  --olive:#DDE0C0;       /* warm neutral: informational tags, neutral badges */

  /* Forest ramp */
  --forest-900:#042A25;  --forest-600:#0B5648;  --forest-400:#2C7A66;

  /* Text-safe green — see rule 3.1 */
  --emerald-ink:#00743D; --emerald-600:#00A855;

  /* Neutrals */
  --canvas:#F2F6F2;  --card:#FFFFFF;   --line:#DFE7DF;  --line-soft:#EDF2EC;
  --text:#0F2A24;    --text-2:#55706B; --text-3:#8AA098;

  /* Service spectrum — one hue per vertical */
  --food:#C55A20;    --food-soft:#FAEDE4;    --food-vivid:#DC6B2F;
  --grocery:#6E7D2E; --grocery-soft:#F1F4E3; --grocery-vivid:#8A9B3C;
  --parcel:#176E8A;  --parcel-soft:#E2F0F4;  --parcel-vivid:#1E88A8;

  /* Operational signals */
  --go:#00743D;    --go-soft:#DCF6E8;     /* delivered, completed, paid, healthy */
  --watch:#A9700A; --watch-soft:#FBF1DC;  /* pending, preparing, due, under review */
  --stop:#BC3C2A;  --stop-soft:#FAE7E3;   /* cancelled, delayed, failed, suspended */
  --calm:#55706B;  --calm-soft:#EAF0EC;   /* idle, archived, metadata */

  /* Geometry */
  --r-card:14px; --r-ctrl:10px; --r-pill:999px;
  --shadow:0 1px 2px rgba(6,56,49,.05), 0 10px 26px -16px rgba(6,56,49,.25);

  /* Type */
  --sans:'Plus Jakarta Sans',Inter,-apple-system,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
}
```

### 3.1 The one colour rule you will get wrong

`--emerald` (#00BF63) measures **2.21:1** against white. It fails WCAG AA for text.

- Green **behind** words → `--emerald` (button fills, badges, dots, chart strokes)
- Green **that is** the words → `--emerald-ink` (#00743D, 5.08:1 — links, positive deltas, active tab labels)

There is no third case.

### 3.2 Service colour consistency

Once a vertical has its hue it keeps it everywhere: the dot in the table row, the slice in the donut, the bar in the chart, the badge on the tile, the accent in the drawer. A reader learns three colours once and never re-reads a legend.

### 3.3 Signal colours are not brand colours

Never use a signal colour as a page background or a button fill. Never use emerald for "pending" just because the platform is green — pending is `--watch`. If a state does not fit go / watch / stop / calm, it is a variant of one of them. Do not invent a fifth.

---

## 4. Typography

| Level | Size / weight | Colour | Used for |
|---|---|---|---|
| Page title | 26px / 800 / −3% tracking | `--forest` | One per screen |
| Panel title | 14px / 800 / −2% | `--forest` | Card and table headers |
| Body | 13px / 400–500 | `--text` | Table cells, descriptions |
| Supporting | 11.5px / 500 | `--text-2` | Second line under a title, hints |
| Eyebrow | 9–10px / 500 / +12% tracking / uppercase | `--text-3` | Column headers, KPI labels, nav groups. **Always mono** |

### The data face

Every figure in the product is `--mono` with `font-variant-numeric: tabular-nums`. Proportional figures make a column of amounts unscannable.

**Mono:** currency amounts, IDs (`F-2841`, `PAY-2061`, `REQ-118`), durations, ETAs, timestamps, percentages, ratings, phone numbers, coupon codes, all eyebrow labels.

**Never mono:** sentences, button labels, names of people, vendors or places, headings.

Currency renders as a 12px `--text-3` prefix plus the figure at full size: `FCFA 2 140 000`.

---

## 5. Component specifications

### 5.1 Buttons

Six variants. Height 36px, radius 999px, 13px/700, unless stated.

| Variant | Style | Used for |
|---|---|---|
| `primary` | `--emerald` fill, white text | The single highest-intent action on a screen. **Max one per view.** Release payout, create offer, mark delivered |
| `command` | `--forest` fill, white text | High-priority operational moves. Track live, export day, add vendor, reassign rider |
| `outline` | transparent, 2px `--emerald` border, `--forest` text | Non-destructive alternates beside a primary. Filter, export, edit |
| `soft` | `--pastel` fill, `--forest` text. Height 28px, 12px/700 | Inline actions inside cards, tiles, banners |
| `tag` | `--olive` fill, `--forest` text. Height 22px, 11px/700 | Not a button. Category chips, neutral metadata |
| `destructive` | white, 1px `#EFCDC7` border, `--stop` text | Cancel, decline, suspend, refuse |

**Footer order is always: destructive · neutral · primary**, left to right.

### 5.2 Card

Radius 14px, 1px `--line` border, `--shadow`, 15–16px padding. Header row separated by 1px `--line-soft`.

### 5.3 Metric tile (KPI)

Min width 214px. Grid: `repeat(auto-fit, minmax(214px, 1fr))`, 14px gap.

- Label: mono 9.5px uppercase, +12% tracking, `--text-3`
- Value: mono 27px / 600 / −3% tracking, `--forest`
- Delta chip: mono 11px pill — `--go-soft`/`--go` for up, `--stop-soft`/`--stop` for down, `--olive` for flat
- Supporting note: 11.5px `--text-2` beside the chip
- Sparkline: 104 × 34px SVG, absolutely positioned bottom-right, bleeding into the corner. Card has `overflow: hidden`

### 5.4 Table

- Header: `#F5F9F5` background, mono 9px uppercase +12% tracking, `--text-2`
- Row height 44px, 12px/15px cell padding, 1px `--line-soft` divider, last row no divider
- Hover `#F7FBF8`
- Figures right-aligned mono with tabular numerals
- ID cells mono 12px `--forest`, with an 11px `--text-3` sub-line beneath where useful
- Min width 660px inside a horizontally scrolling container
- Toolbar above the table: title, count in mono, filter input pushed right

### 5.5 Status pill

Radius 999px, 3px × 9px padding, 11px/700, **lowercase**. Leading 5px dot inheriting the text colour. Word plus dot — state is never carried by colour alone.

Status → token map:

```
new, accepted            → parcel      preparing, ready       → watch
on the way, delivered    → go          cancelled, delayed     → stop
completed, paid, active  → go          pending, due, review   → watch
failed, suspended        → stop        idle, archived         → calm
```

### 5.6 Drawer vs modal

This is a functional rule, not a style choice.

| Pattern | Use when | Spec |
|---|---|---|
| **Drawer** (slides from right) | Inspecting something that exists — an order, a vendor, a rider. The list behind stays visible and keeps its scroll | 530px, full height, 280ms `cubic-bezier(.3,.9,.3,1)` |
| **Modal** (centre, scales in) | Creating something new, or confirming an irreversible action | 570px, max-height 88vh, 18px radius, 200ms scale .98 → 1 |

Both sit over a `#06383166` veil with 3px blur. Both close on Escape and on veil click. Neither ever opens another of itself.

### 5.7 Other

- **Form control:** 38px height, 10px radius, focus = `--emerald` border + 3px `#00BF631F` ring. Label 11.5px/700 `--text-2`
- **Toggle:** 40 × 22px track, 16px knob with 3px inset, `#CBD8D0` off, `--emerald` on, 200ms
- **Toast:** `--forest` pill, white 13px/600, bottom centre, check icon, auto-dismiss at 2.6s
- **Empty state:** heading 14.5px/800 `--forest` saying what is not there → 12.5px `--text-2` line naming the consequence → one primary action. Never an illustration, never "oops", never an exclamation mark

---

## 6. Application frame

```
┌────────────┬─────────────────────────────────────────────┐
│ RAIL 242px │ TOPBAR 60px                                 │
│ forest     ├─────────────────────────────────────────────┤
│ gradient   │ SCROLL AREA · 22px gutter                   │
│            │                                             │
│ reeyo      │  Page title + actions                       │
│ ────────   │  ┌───────────────────────────────────────┐  │
│ OPERATE    │  │ ORDER FLOW rail (dark, live)          │  │
│ Overview   │  └───────────────────────────────────────┘  │
│ Orders   6 │  [metric] [metric] [metric] [metric]        │
│ Dispatch   │  ┌───────────────┐ ┌───────────────┐        │
│            │  │ FOOD tile     │ │ GROCERY tile  │        │
│ SUPPLY     │  └───────────────┘ └───────────────┘        │
│ Vendors    │  ┌───────────────────────────────────────┐  │
│ Riders     │  │ PARCEL full-width banner              │  │
│ Customers  │  └───────────────────────────────────────┘  │
│            │  ┌─────────────────────┐ ┌──────────────┐   │
│ GROWTH     │  │ primary table 1.55fr│ │ panels 1fr   │   │
│ Storefront │  └─────────────────────┘ └──────────────┘   │
│ Marketing  │                                             │
│ MONEY      │                                             │
│ Payments 3 │                                             │
│ Analytics  │                                             │
│ CONFIGURE  │                                             │
│ Settings   │                                             │
│ ────────   │                                             │
│ [avatar]   │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Reading order is fixed on every page:** live state → aggregate figures → service breakdown → actionable detail.

### Sidebar

- 242px, `linear-gradient(180deg, var(--forest) 0%, var(--forest-900) 100%)`
- Nav grouped under mono 9px uppercase labels: **Operate · Supply · Growth · Money · Configure**
- Item: 13.5px/700, 17px stroke icon at 0.75 opacity
- Active: `#00BF6320` background, white text, emerald icon, 3px emerald bar bleeding off the left edge
- Live badges: open order count on Orders, pending payout count on Payments (emerald fill, forest text)
- Footer: avatar chip, "Adrian Nkeng · Platform admin · Buea"

### Topbar

Location selector pill (`--go-soft` background, emerald pin icon, "Bonduma Gate, Buea" — this is a brand element from guide §5.2, keep it), search input pushed right with a `/` keyboard hint, alert bell with emerald dot, refresh button.

### Responsive

- **< 1080px** — two-column splits collapse to one
- **< 860px** — sidebar becomes an overlay behind a menu button; service tiles stack; keyboard hints hide

---

## 7. Data model

`src/data/types.ts`:

```ts
export type Vertical = 'food' | 'grocery' | 'parcel';
export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready'
                        | 'on the way' | 'delivered' | 'cancelled' | 'delayed';
export type Zone = 'Molyko' | 'Bonduma' | 'Great Soppo' | 'Mile 16' | 'Muea';

export interface Order {
  id: string;            // F-2841 | S-1192 | P-0774
  vertical: Vertical;
  customer: string;
  vendor: string;
  rider: string | null;
  items: string;
  total: number;         // FCFA
  status: OrderStatus;
  zone: Zone;
  placedAgo: string;     // "12 min ago"
  eta: string;           // "8 min" | "late 14 min" | "done"
  payment: string;       // "MTN MoMo" | "Orange Money" | "Cash" | "Card"
}

export interface Vendor {
  id: string; name: string; vertical: Vertical; category: string;
  zone: Zone; orders: number; revenue: number; rating: number;
  prepMinutes: number; status: 'active' | 'suspended' | 'review'; joined: string;
}

export interface Rider {
  id: string; name: string; zone: Zone; vehicle: 'Moto' | 'Bicycle' | 'Car';
  trips: number; rating: number; owed: number;
  state: 'on a delivery' | 'idle' | 'running late'; phone: string;
}

export interface Customer {
  id: string; name: string; zone: Zone; orders: number; spend: number;
  lastOrder: string; rating: number;
  segment: 'new' | 'active' | 'loyal' | 'lapsed';
}

export interface Payment {
  id: string; date: string; amount: number; from: string; to: string;
  method: string; reason: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface PayoutRequest {
  id: string; who: string; kind: 'Rider' | 'Vendor'; amount: number;
  date: string; method: string; number: string;
  status: 'pending' | 'approved' | 'failed';
}

export interface Offer {
  id: number; name: string; code: string; vertical: string; zone: string;
  type: 'Percent off' | 'Amount off' | 'Free delivery' | 'Flat delivery fee';
  value: string; payer: 'Platform' | 'Vendor' | 'Split 50/50';
  uses: number; spent: number; active: boolean; ends: string;
}

export interface Banner {
  id: number; name: string; vertical: string; zone: string;
  destination: string; active: boolean; taps: number;
}
```

### Seed data requirements

- **12 orders** spread across all three verticals and all seven live statuses, including at least one delayed and one cancelled
- **8 vendors**: 4 food, 3 grocery, 1 parcel agent. One suspended, one under review. One food vendor has a full nested menu (2 categories, 5 items, with prices, discount prices, stock levels, add-ons, opening hours and available days) — every other vendor has an empty menu so the empty state is reachable
- **6 riders** across the zones with mixed states and ratings, at least one below 4.2
- **7 customers** covering all four segments
- **7 payments** including one failed, **4 payout requests** with 3 pending
- **3 offers**, **3 banners**, **3 announcements**, **5 spin-wheel prizes**

Names should be Cameroonian and plausible: Anna Mbella, Marc Etoa, Peter Samu, Sarah Ngo, Clarisse Eto. Vendors: GreenBowl, Chez Mado, Pizza Palace, UrbanMart, Pharma Plus, Buea Express.

---

## 8. Pages

### 8.1 Overview — the one that matters most

Build this first and get it right before moving on.

**a) Order-flow rail — the signature element.** A dark forest-gradient panel above everything else, with a radial emerald glow at the top left. Seven stages: New · Accepted · Preparing · Ready · On the way · Delivered · Problem (delayed + cancelled).

Each stage shows a mono 23px zero-padded count (`04`), an 11px label, and a 3px track filled proportionally to the largest count, in that stage's colour, animating left to right on load with a 60ms stagger. A "LIVE" eyebrow with a pulsing emerald dot sits beside the title.

**Clicking a stage filters the panels below it and dims the other stages. Clicking again clears.** This is the interaction that makes the rail worth its space — it is not decoration.

**b) Four metric tiles:** Orders today · Gross value · Avg delivery · Cancel rate. Each with delta chip and sparkline.

**c) Service grid** — this follows Brand Guide §5.1 exactly. Two equal tiles (Food left, Grocery right) above one full-width Parcel banner.

- Tiles: white, 1.5px `--pastel` border, service dot beside the name, three mono figures (orders · value · in flight), one signal pill, one soft button
- Banner: 135° gradient `--pastel` → `--mint`, 1.5px `--mint` border, forest text, right-aligned figures, closed by a `command` button

**d) Two-column split:** "Orders needing a decision" table (1.55fr) beside a revenue donut and an alert list (1fr). Alert items are clickable and navigate to the relevant page.

### 8.2 Orders

Segmented control: All / Food / Grocery / Parcel with counts. Table columns: Order (ID + placed time) · Customer (+ payment method) · Vendor · Rider (unassigned shown in `--text-3`) · Zone · Total · ETA (red when late) · Status (an inline `select` that changes status live) · Open.

Changing a status must update the order-flow rail, the service tiles, the sidebar badge and fire a toast, all in the same tick.

Text filter over ID, customer, vendor, rider and zone. Empty state with a "Clear filter" action.

**Order drawer:** journey timeline with completed steps in emerald and pending steps greyed, basket breakdown with delivery fee separated, people block, footer with `destructive` Cancel · `outline` Reassign rider · `primary` Mark delivered.

### 8.3 Live dispatch

Four tabs: Map / Zones / Teams / Delivery fees.

- **Map:** dark forest panel, SVG grid pattern, three road paths, rider dots colour-coded by state with a soft halo ring and a mono ID label above each. Legend beneath. Beside it, a live rider list.
- **Zones:** one card per zone with rider count, active orders, a capacity bar (green under 50%, amber 50–75%, red above) and average delivery time
- **Teams:** table of delivery teams with lead, size, zone, shift and load
- **Fees:** four rule cards (Standard, Long distance, Peak hours, Parcel) each with base fare, per-km rate, conditions and an on/off toggle

### 8.4 Vendors

Segmented by vertical. Table with avatar, category, joined date, orders, revenue, prep time, rating, status. Two row actions: **Menu** opens a modal, **Open** opens a drawer.

**Menu modal:** categories with opening hours, available days and a visibility toggle; items with price, struck-through original price, stock, add-on count and an availability toggle. Vendors without a menu get the empty state.

**Vendor drawer:** two metric tiles, a performance block, an account block, footer with Suspend · Edit menu · Release payout.

### 8.5 Riders / 8.6 Customers

Metric row plus a filterable table. Riders: zone, vehicle, trips, rating (red below 4.2), amount owed, live state, pay-out action. Customers: orders, lifetime spend, last order, segment pill.

### 8.7 Storefront

Two panels. **Home banners** — drag-and-drop reorderable list with gradient thumbnails, tap counts and visibility toggles. **Section order** — numbered list of home sections with toggles. Numbering here is legitimate: the order genuinely determines what the customer sees first.

### 8.8 Marketing

Three tabs. **Offers:** metric row plus a table with code, reward, who absorbs the cost, redemptions, spend and a live toggle. **Announcements:** compose form (headline, message, audience, channel) beside a sent history with reach and open rate. **Spin wheel:** prize weights as a bar list beside a hand-drawn SVG wheel where each slice is sized by its weight.

### 8.9 Payments

Metric row, then four tabs: **Ledger** (every transaction, filterable) · **Vendor settlements** (gross → commission 15% → service fee 2.5% → net, deductions shown in `--text-2` with a minus sign) · **Rider settlements** (gross → platform cut 10% → net) · **Payout requests** (approve and pay, or decline).

Approving a payout updates the sidebar badge immediately.

### 8.10 Analytics

Four tabs: Money · Growth · Operations · Experience. Each opens with a metric row then a two-column split of charts. Include: 30-day GMV columns, a money-split donut, weekly returning customers, top vendors bar list, delivery time by zone (bars coloured by threshold), cancellation reasons, rating distribution, open complaints.

### 8.11 Settings

Commission and fee inputs, payment method toggles, platform switches (accept new orders, scheduled orders, auto-assign riders, surge pricing, vendor self-signup — each with a one-line consequence beneath), and an admin team list.

---

## 9. Data visualisation

Hand-rolled SVG only.

| Form | Rules |
|---|---|
| **Sparkline** | 104 × 34px, 1.6px stroke, gradient area fill 18% → 0%, bled into the tile's bottom-right corner. No axes, no labels, no tooltip |
| **Column chart** | 3px gap, 3px top radius, opacity scaled 0.45 → 1 by value. Only first, middle and last labels printed |
| **Bar list** | Label left, mono figure right, 6px bar below at pill radius. Bar takes the service or signal colour of what it measures |
| **Donut** | 15px stroke, 2px white gap between slices, legend right with mono values. Max five slices; a sixth becomes "Other" |

**Colour in a chart is never decorative.** A series takes the colour of the thing it represents. No sequential rainbow palettes.

---

## 10. Copy rules

| Rule | Write | Not |
|---|---|---|
| Name the outcome, not the mechanism | Release payout · Mark delivered | Submit · Process transaction |
| Keep one name through a flow | "Release payout" → "FCFA 96 200 released to Sarah Ngo" | "Release payout" → "Transaction successful" |
| Confirmations state what happened | F-2841 is now delivered | Success! · Done |
| Errors give the fix | Give the offer a name first | Invalid input |
| Sentence case, no exclamation marks | Orders needing a decision | Orders Needing A Decision! |
| Say the money plainly | FCFA 434 700 waiting, oldest is 2 days | Pending disbursement backlog detected |

---

## 11. Accessibility floor

Not a phase two. Every screen ships against this.

- [ ] Body and label text meets 4.5:1; large text and UI boundaries meet 3:1
- [ ] Green that carries words is `--emerald-ink`, never `--emerald`
- [ ] State never carried by colour alone — every pill has a dot and a word, every chart has a legend
- [ ] Visible focus on every interactive element: 2px `--emerald` ring, 2px offset
- [ ] Full keyboard reach; Escape closes any overlay; `/` focuses search
- [ ] `prefers-reduced-motion` disables all animation and transition
- [ ] Every icon-only control has an `aria-label`; overlays declare `role="dialog"` and `aria-modal`
- [ ] Layout holds 360px → 1920px with no horizontal scroll outside wide tables

---

## 12. File structure

```
src/
  styles/tokens.css        # section 3, imported first
  data/types.ts            # section 7
  data/seed.ts             # all seed arrays
  lib/format.ts            # money(), fcfa(), initials(), statusToken()
  components/
    layout/  Rail.tsx  Topbar.tsx  Shell.tsx
    ui/      Button.tsx  Card.tsx  MetricTile.tsx  DataTable.tsx
             Pill.tsx  Segments.tsx  Toggle.tsx  Field.tsx
             Drawer.tsx  Modal.tsx  Toast.tsx  EmptyState.tsx
    charts/  Sparkline.tsx  ColumnChart.tsx  BarList.tsx  Donut.tsx
    domain/  OrderFlowRail.tsx  ServiceGrid.tsx  OrderDrawer.tsx
             VendorDrawer.tsx  MenuModal.tsx  RiderMap.tsx
  pages/     Overview.tsx  Orders.tsx  Dispatch.tsx  Vendors.tsx
             Riders.tsx  Customers.tsx  Storefront.tsx  Marketing.tsx
             Payments.tsx  Analytics.tsx  Settings.tsx
```

---

## 13. Build order

Stop at each checkpoint and show the result before continuing.

**Phase 1 — Foundation.** Vite + React + TS + Tailwind, tokens, fonts, `format.ts`, and the shell: sidebar with grouped navigation and badges, topbar, routing to eleven empty pages.
*Checkpoint: the frame renders, navigation works, active states are correct.*

**Phase 2 — UI primitives.** Every component in `components/ui/` built to section 5, plus the four charts. Build a scratch route that renders all of them together so they can be reviewed side by side.
*Checkpoint: every variant visible on one screen, spacing and colour verified.*

**Phase 3 — Overview.** Seed data, order-flow rail with working stage filtering, metric row, service grid, attention table, donut, alert list.
*Checkpoint: this page should look finished. Do not proceed until it does.*

**Phase 4 — Orders and Dispatch.** Full order table with live status changes propagating to the rail, tiles and sidebar badge. Order drawer. All four dispatch tabs.

**Phase 5 — Vendors, Riders, Customers.** Tables, drawers, the menu modal with its empty state.

**Phase 6 — Storefront, Marketing, Payments, Analytics, Settings.**

**Phase 7 — Polish.** Accessibility pass against section 11, responsive pass at 360 / 768 / 1080 / 1440, reduced-motion, empty states for every table, keyboard shortcuts.

---

## 14. Definition of done

- [ ] Every page fully populated — no empty tabs, no "coming soon"
- [ ] Changing an order status updates the rail, the service tiles and the sidebar badge together
- [ ] Clicking a stage in the order-flow rail filters the content below it
- [ ] Approving a payout decrements the Payments badge
- [ ] Every table has a working filter and a written empty state
- [ ] Drawers and modals close on Escape and on veil click
- [ ] `grep -r "#" src/components` returns no raw hex outside `tokens.css`
- [ ] No emoji, no icon library, no chart library, no component library in `package.json`
- [ ] Section 11 checklist fully ticked
- [ ] Runs on `npm run dev` with zero console errors and zero TypeScript errors

---

## 15. When to stop and ask

- A colour is needed that is not in section 3
- A state does not fit go / watch / stop / calm
- A page needs a second primary button
- Section 5 and the brand guide appear to conflict

Do not resolve these by inventing a value. Ask.

---

## 16. Project history and prior art

This console **replaces** an earlier admin panel that lived in `frontend/`. That app was a JavaScript (not TypeScript) Vite build wired to a live `admin-api` backend over cookie-based auth. It is preserved on the `main` branch; this rebuild happens on `rebuild/operations-console`.

Two things from it are worth knowing:

1. **`audit/` documents what that app got right and wrong.** It is kept in the repo deliberately. `audit/security.md` describes an auth design worth re-using verbatim when this console eventually gets a backend: HTTP-only cookies, no token in JS-reachable storage, a single de-duplicated silent refresh on 401. `audit/bugs-and-gaps.md` records the failure modes to design out from the start — an unwired sign-out button, a header that showed a hardcoded identity instead of the real session, and success screens for flows that never contacted a server.

2. **The brand mark is already in the repo** at `frontend/public/logo.svg` — a rounded forest square with the emerald reeyo swoosh. Its two colours are exactly `--forest` (#063831) and a near-neighbour of `--emerald`. Carry it into the new build's `public/`.

**This spec's "no backend, no API calls" rule is a scope boundary, not a rejection of that work.** Phases 1–7 build against local seed data so the interface can be judged on its own. Wiring it to `admin-api` is deliberate future work; keep the seed data behind `src/data/` so the swap is a data-layer change, not a rewrite of every page.

### Section 3 and the logo

The brand mark's emerald reads brighter than `--emerald-ink`. That is correct and not a violation of rule 3.1 — the logo is a graphic, not text. Do not "fix" it to the text-safe green.
