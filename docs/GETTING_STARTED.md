# Getting Started — Reeyo Admin Panel

Prerequisites
-------------
- Node.js (16+ recommended)
- npm or pnpm

Local setup
-----------
1. Clone the repo and change directory:
   - `cd Reeyo-AdminPanel/frontend`
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`

Environment
-----------
- Copy `.env.example` to `.env` (if present) and set API endpoints pointing to `Reeyo-Backend`.

Build
-----
- `npm run build` produces production assets in `dist/`.

Notes
-----
- The app expects an admin API hosted by `Reeyo-Backend/admin-api`.
