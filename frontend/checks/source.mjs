// Source-level rules that a browser cannot check.
//
// The console has a sample mode, so seed data legitimately exists. What must
// not happen is seed rows rendering in LIVE mode, where they sit in the same
// columns as real figures and read as platform data. Asserting that in a
// browser would need a working sign-in, which these suites do not have — so it
// is asserted here, against the source.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src');

let failed = 0;
function check(name, cond, detail) {
  if (!cond) failed++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

const read = (rel) => (existsSync(join(SRC, rel)) ? readFileSync(join(SRC, rel), 'utf8') : null);

/* ---- Every seed-backed panel is withheld when live ---------------------- */

// Each of these renders rows that no endpoint supplies. They may show in
// sample mode and must not show in live mode, which NoEndpoint enforces.
const WITHHELD = [
  ['pages/Dispatch.tsx', 'Zone capacity'],
  ['pages/dispatch/TeamsPanel.tsx', 'Delivery teams'],
  ['pages/dispatch/FeesPanel.tsx', 'Delivery fee rules'],
  ['pages/Marketing.tsx', 'Promo codes and offers'],
  ['pages/Storefront.tsx', 'Home section ordering'],
  ['pages/Settings.tsx', 'Payment method availability'],
];

for (const [file, what] of WITHHELD) {
  const src = read(file);
  check(
    `${what} is withheld in live mode`,
    src !== null && src.includes('NoEndpoint') && src.includes(what),
    src === null ? 'file missing' : undefined,
  );
}

check(
  'NoEndpoint renders nothing but an explanation when live',
  (read('components/ui/NoEndpoint.tsx') ?? '').includes('if (isSample) return'),
);

check(
  'the old annotate-and-show-anyway notice is gone',
  !existsSync(join(SRC, 'components/ui/LocalOnly.tsx')),
);

/* ---- Money is never computed from assumed rates ------------------------- */

const payments = read('pages/Payments.tsx') ?? '';
check(
  'settlement rates are not hard-coded',
  !/const\s+(COMMISSION|SERVICE_FEE|RIDER_CUT)\s*=\s*0\./.test(payments),
);
check(
  'settlement rates come from the platform config',
  payments.includes('usePlatformAdmin') && payments.includes('useRates'),
);
check(
  'the page says where its deduction rates came from',
  payments.includes('RateSource'),
);

/* ---- Seed imports stay out of the pages that went live ------------------ */

// These pages read their rows from the API now. A seed import creeping back
// into one of them is the regression this rule exists to catch.
const LIVE_PAGES = [
  'pages/Orders.tsx', 'pages/Customers.tsx', 'pages/Riders.tsx',
  'pages/Approvals.tsx', 'pages/Disputes.tsx', 'pages/Payments.tsx',
];

for (const file of LIVE_PAGES) {
  const src = read(file);
  check(
    `${file.replace('pages/', '')} imports no seed data`,
    src !== null && !/from '\.\.?\/[./]*data\/seed'/.test(src),
  );
}

/* ---- Dead state does not accumulate ------------------------------------- */

const contract = read('state/useAppState.ts') ?? '';
check(
  'the superseded local banner state is gone',
  !contract.includes('reorderBanners') && !contract.includes('moveBanner'),
);

/* ---- UI-only never reaches production ---------------------------------- */

// VITE_UI_ONLY makes the console skip sign-in entirely and run on seed data.
// That is exactly right on a laptop and catastrophic on the deployed admin
// tool, where it would hand anyone who loads the page a full console.
const prodEnv = existsSync(join(SRC, '..', '.env.production'))
  ? readFileSync(join(SRC, '..', '.env.production'), 'utf8')
  : '';
check(
  'UI-only mode is not enabled in the production build',
  !/^\s*VITE_UI_ONLY\s*=\s*true/m.test(prodEnv),
);

console.log(failed === 0 ? '\nAll source checks pass.' : `\n${failed} failing.`);
process.exit(failed ? 1 : 0);
