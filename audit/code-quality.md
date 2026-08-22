# Code quality & tooling

## ESLint is configured to lint almost nothing

`frontend/eslint.config.js:11` scopes every rule set (`js.configs.recommended`, `tseslint.configs.recommended`, the React Hooks rules, `react-refresh`) to:

```js
files: ['**/*.{ts,tsx}'],
```

But the codebase has exactly **one** `.ts`/`.tsx` file in `src/` — the auto-generated `vite-env.d.ts` — out of **75** `.js`/`.jsx` source files. Running `npm run lint` will report success having checked effectively nothing. This means:
- `eslint-plugin-react-hooks` (rules-of-hooks, exhaustive-deps) is not actually protecting any of the ~30 pages that use `useEffect`/`useCallback` extensively.
- Nothing catches unused vars, unreachable code, or the well-known React footguns anywhere in the real app.

Given the project has real TypeScript tooling installed (`typescript`, `typescript-eslint`, `tsconfig.app.json` with `strict: true`) but a 100% `.jsx` codebase, this looks like a starter-template config (`vite-react-typescript-starter` — see `frontend/package.json:2`) that was never updated when the project settled on plain JSX. Fix is a one-line glob change (`**/*.{js,jsx,ts,tsx}`) plus whatever cleanup surfaces once it actually runs.

## No automated tests

No `*.test.*` / `*.spec.*` files exist anywhere in `frontend/src`, and no test runner (Jest/Vitest/Testing Library) is in `package.json`. `docs/DEVELOPMENT.md` acknowledges this directly ("Add unit tests using your preferred test runner (not included by default)"). For an admin panel that handles refunds, disputes, KYC, and API key issuance, this is worth prioritizing over new features — at minimum for `apiClient`'s retry/refresh logic and the role-gating in `ProtectedRoute.jsx`, both of which are pure-enough to unit test cheaply.

## Naming inconsistencies

- `frontend/src/pages/Chat/ChatPaage.jsx` — filename and component (`ChatPaage`) both misspell "Page". Functions correctly; just a typo that will confuse anyone searching for `ChatPage`.
- `frontend/src/pages/Auth/components/ForgotPasswordForm.jsx` exports a component named `ForgetPasswordForm` (file says Forgot, component says Forget) and its own header comment even says `// src/components/auth/ForgetPasswordForm.jsx` — a path that doesn't match where the file actually lives (`pages/Auth/components/`). Cosmetic, but a small tax on every future grep.
- Several files carry stale header comments describing an old location (e.g. `ThemeContext.jsx:1` — `// src/ThemeContext.jsx (or src/context/ThemeContext.jsx)`), suggesting files were moved during a refactor without updating their own doc comments.

## Leftover mock-data imports (see [api-integration.md](api-integration.md) for the full breakdown)

`frontend/src/data/` still contains `announcementMocks.js`, `chatMocks.js`, `menuApprovalMocks.js`, `zoneMocks.js`. Two of these (`chatMocks.js`, and `appVersions` from `announcementMocks.js`) back genuinely unmigrated features; the other two are only supplying small formatting helper functions (`formatFCFA`, `formatDeliveryFee`, `colorForZoneId`) to otherwise real-API-backed pages, which is misleading at a glance during any future "grep for mock imports to find migration debt" pass.

## Dependency hygiene

- `@supabase/supabase-js` is a real, non-trivial dependency (client + realtime + auth) pulled in for a single unused file (`frontend/src/lib/supabase.js`). Either wire it in or drop it — right now it's shipped in the bundle for no functional benefit.
- `frontend/package.json:2` — `"name": "vite-react-typescript-starter"` — never renamed from the Vite scaffold default. Harmless but worth fixing for anyone reading `npm ls` output or a future monorepo integration.

## What's good

- Consistent per-page pattern: `useState` + `useCallback`-wrapped fetch + `loading`/`error` state + `apiClient` call, repeated cleanly across ~30 pages rather than reinvented each time.
- `apiClient.js` itself is small, well-commented (explains *why*, e.g. the cookie-only auth decision and the `/auth/refresh` path history), and has no over-engineering — no premature retry/backoff abstraction beyond the one real need (401 → refresh → retry once).
- Lazy-loading every route (`React.lazy` in `App.jsx`) keeps the initial bundle down for an app with this many distinct feature pages.
