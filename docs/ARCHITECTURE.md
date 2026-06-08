# Architecture — Reeyo Admin Panel

Tech stack
----------
- Vite + React
- Tailwind CSS
- Supabase (folder present in repo; used for migrations/DB tasks)

Folder structure
----------------
- `frontend/src/` — React components and pages
- `frontend/src/components/` — reusable UI components
- `frontend/src/pages/` — route pages
- `frontend/src/context/` — app context and providers

Integration points
------------------
- Auth and data APIs call into `Reeyo-Backend` services.

Performance & build
-------------------
- Use Vite dev server for fast HMR; production build produces static assets.
