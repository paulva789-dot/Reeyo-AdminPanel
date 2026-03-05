# Installation — Reeyo Admin Panel

Prerequisites
-------------
- Node.js 16+ (use Node 18+ recommended)
- npm (or pnpm)
- Git

Clone & install
---------------
1. Clone repository and change directory to the admin frontend:

```bash
git clone <repo-url>
cd Reeyo-AdminPanel/frontend
```

2. Install dependencies:

```bash
npm install
# or: pnpm install
```

Environment configuration
-------------------------
- Vite requires `VITE_` prefixed env variables. Copy the example and edit:

```bash
cp .env.example .env
# Edit VITE_API_URL to point to your backend (e.g. http://localhost:3005)
```

Run locally
-----------

```bash
npm run dev
# open http://localhost:5173 (default Vite port)
```

Build for production
--------------------

```bash
npm run build
# Serve preview locally
npm run preview
```

Notes
-----
- The Admin Panel expects an admin API (see `Reeyo-Backend/apps/admin-api`). Update `VITE_API_URL` accordingly.
