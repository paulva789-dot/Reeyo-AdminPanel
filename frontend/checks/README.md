# Checks

Browser-driven verification for the console. These drive a real headless Chrome
against a running dev server over the DevTools Protocol, so they exercise the
app a person actually meets rather than an imported function.

```bash
npm run dev        # terminal one
npm run checks     # terminal two
```

`CHECK_URL` overrides the app URL (default `http://localhost:5180`) and
`CHROME_PATH` the browser binary.

| Suite | What it proves |
|---|---|
| `logic.mjs` | Pure logic and adapters against empty and malformed input — the cases live data produces and the seed never does |
| `pages.mjs` | Every page renders real content, with no console errors |
| `interactions.mjs` | The behaviours section 14 of `CLAUDE.md` requires |
| `capabilities.mjs` | Disputes, menu approvals and API keys |
| `auth.mjs` | The sign-in gate, against the **real** backend |
| `regions.mjs` | Region scoping across the whole console |
| `responsive.mjs` | No horizontal scroll from 360px to 1920px |

## Two rules these earned the hard way

**Assert something only the working app can satisfy.** `pages.mjs` once reported
all pages clean while sitting on the sign-in screen the entire time, because its
checks — main text present, one `h1` — were satisfied by the login page too. It
now asserts the rail exists and the heading matches the page it navigated to.
A green check that cannot tell "it works" from "it never loaded" is worse than
no check.

**Poll for readiness; never sleep a guessed interval.** A fixed wait passed until
the bundle grew, then failed on cold starts and looked like a regression. Every
suite now polls.

## auth.mjs depends on a live backend

It signs in against the deployed `admin-api`, so it is the one suite whose
timing is not under our control. `/auth/me` takes several seconds and the app
gives it an 8-second budget, which sits close enough to that latency to shift
behaviour between runs.

Two things follow. The suite counts a request as made when it is **sent**, not
when it is answered — an aborted request emits `loadingFailed`, never
`responseReceived`, so listening only for responses made a real call invisible.
And the runner retries a failed suite once, naming any suite that passed only on
the retry rather than quietly turning the run green.

## When a suite fails

Read the DOM before re-running. Several "failures" here were the harness picking
the wrong element — a case-sensitive match against an uppercased label, the first
of two buttons that legitimately share a name, the drawer's textarea instead of
the modal's. The app was fine each time. Distinguishing the two costs one probe
and saves a wrong fix.
