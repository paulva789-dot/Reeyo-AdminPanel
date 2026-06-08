# Troubleshooting — Reeyo Admin Panel

Common issues
-------------

- "Port already in use": Kill process using port (Windows):

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

- "API calls fail": Ensure `VITE_API_URL` points to the running admin API and CORS is enabled on the backend.

- "Type errors on build": Run `npm run typecheck` to inspect TypeScript issues.

If problems persist, open an issue with logs and reproduction steps.
