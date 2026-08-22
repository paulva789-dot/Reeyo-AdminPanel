Reeyo Admin Panel
=================

Overview
--------
The Reeyo Admin Panel is a Vite + React frontend used to manage the Reeyo platform. It provides dashboards, user & vendor management, and integrations with backend APIs located in `Reeyo-Backend`.

**Current Status:** The admin panel is wired to the real `admin-api` backend over cookie-based auth (see `frontend/src/services/apiClient.js`). Most pages fetch live data; a small number of features (Chat, Forgot Password, App Version Control) are still local-only pending backend endpoints — see [BACKEND_ENDPOINT_REQUESTS.md](docs/BACKEND_ENDPOINT_REQUESTS.md) for what's tracked as open.

Quick start
-----------
- Install dependencies: `cd Reeyo-AdminPanel/frontend && npm install`
- Point `VITE_API_BASE_URL` (in `frontend/.env`) at a running `admin-api` instance — see `frontend/.env.example`
- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Sign in with credentials issued by the connected `admin-api`

Docs
----
- See `docs/GETTING_STARTED.md` for setup details.
- See `docs/ARCHITECTURE.md` for code structure and tech stack.
- See `docs/DEVELOPMENT.md` for contributing and local development notes.

Useful files
------------
- `frontend/package.json` — scripts & deps
- `frontend/vite.config.ts` — build config
- `frontend/src/` — application source
