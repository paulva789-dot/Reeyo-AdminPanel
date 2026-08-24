// Runs the browser-driven checks against a dev server.
//
//   npm run dev          # in one terminal
//   npm run checks       # in another
//
// One browser for the whole run, reset to a blank page between suites.
//
// Relaunching Chrome per suite looked cleaner but was the single biggest source
// of false failures: on Windows killing the launcher does not kill Chrome's
// process tree, so the old instance kept the debug port and the new one raced
// it. Suites then failed with empty pages that read exactly like app bugs.

import { spawn, execSync } from 'node:child_process';
import { existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = process.env.CHECK_URL || 'http://localhost:5180';
const PORT = 9222;
// Outside the project on purpose. A Chrome profile inside the Vite root makes
// the dev server watch Chrome's locked Cookies file and die with EBUSY, which
// then looks like every check failing at once.
const PROFILE = mkdtempSync(join(tmpdir(), 'reeyo-checks-'));

const SUITES = [
  ['logic.mjs', 'pure logic and adapters, including empty and malformed input'],
  ['pages.mjs', 'every page renders, with no console errors'],
  ['interactions.mjs', 'the behaviours section 14 requires'],
  ['capabilities.mjs', 'disputes, menu approvals and API keys'],
  ['auth.mjs', 'the sign-in gate against the real backend'],
  ['regions.mjs', 'region scoping across the console'],
  ['responsive.mjs', 'no horizontal scroll from 360px to 1920px'],
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome or Edge found. Set CHROME_PATH to the browser binary.');
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitFor(url, seconds, want = true) {
  for (let i = 0; i < seconds; i += 1) {
    if ((await reachable(url)) === want) return true;
    await wait(1000);
  }
  return false;
}

function killPort() {
  if (process.platform !== 'win32') {
    try { execSync(`bash -lc "lsof -ti:${PORT} | xargs -r kill -9"`, { stdio: 'ignore' }); } catch { /* nothing listening */ }
    return;
  }
  try {
    execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
      { stdio: 'ignore' },
    );
  } catch { /* nothing listening */ }
}

async function browserSocket() {
  const res = await fetch(`http://localhost:${PORT}/json/version`);
  return (await res.json()).webSocketDebuggerUrl;
}

/**
 * The debug port answers before Chrome has a page to drive. Attaching in that
 * window gives a suite nothing to work with.
 */
async function waitForAppTarget(seconds) {
  for (let i = 0; i < seconds; i += 1) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/list`);
      const targets = await res.json();
      if (targets.some((t) => t.type === 'page')) return true;
    } catch { /* browser still coming up */ }
    await wait(500);
  }
  return false;
}

/**
 * Blanks the page between suites so none of them can read the previous one's
 * DOM. Without this a suite polling for familiar text matches the page still on
 * screen and asserts before its own navigation has even started.
 */
async function resetPage(wsUrl) {
  const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  if (!page) return;

  await new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    let sessionId = null;
    let lastId = 0;
    const done = () => { try { ws.close(); } catch { /* already closed */ } resolve(); };
    const timer = setTimeout(done, 8000);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: ++id, method: 'Target.attachToTarget',
        params: { targetId: page.id, flatten: true },
      }));
    };
    ws.onerror = done;
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.result && m.result.sessionId && !sessionId) {
        sessionId = m.result.sessionId;
        // Cookies and cache carry between suites otherwise, so a suite that
        // depends on being signed out inherits whatever the last one left.
        ws.send(JSON.stringify({ id: ++id, sessionId, method: 'Network.enable' }));
        ws.send(JSON.stringify({ id: ++id, sessionId, method: 'Network.clearBrowserCookies' }));
        ws.send(JSON.stringify({ id: ++id, sessionId, method: 'Network.clearBrowserCache' }));
        ws.send(JSON.stringify({
          id: ++id, sessionId, method: 'Page.navigate', params: { url: 'about:blank' },
        }));
        lastId = id;
        return;
      }
      if (m.id && sessionId && m.id === lastId) {
        clearTimeout(timer);
        setTimeout(done, 400);
      }
    };
  });
}

function runFile(file, ws) {
  return new Promise((resolve) => {
    const suite = spawn(process.execPath, [join(HERE, file), ws, HERE], { stdio: 'pipe' });
    let out = '';
    suite.stdout.on('data', (d) => { out += d; });
    suite.stderr.on('data', (d) => { out += d; });
    suite.on('close', (code) => resolve({ ok: code === 0, output: out.trim() }));
  });
}

(async () => {
  if (!(await reachable(APP))) {
    console.error(`Nothing is serving ${APP}. Start it with \`npm run dev\` first.`);
    process.exit(1);
  }

  killPort();
  await waitFor(`http://localhost:${PORT}/json/version`, 20, false);
  rmSync(PROFILE, { recursive: true, force: true });

  const browser = spawn(chrome, [
    '--headless=new', '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    'about:blank',
  ], { stdio: 'ignore' });

  if (!(await waitFor(`http://localhost:${PORT}/json/version`, 30))
      || !(await waitForAppTarget(30))) {
    browser.kill();
    killPort();
    console.error('The browser never came up on its debug port.');
    process.exit(1);
  }

  const ws = await browserSocket();

  let failed = 0;
  const flaky = [];

  for (const [file, what] of SUITES) {
    process.stdout.write(`\n── ${file}  ${what}\n`);
    await resetPage(ws);
    let result = await runFile(file, ws);

    // One retry, and it is reported. auth.mjs talks to the deployed backend,
    // whose latency varies enough to shift timings. A suite that only passes
    // the second time is still worth knowing about, so name it rather than
    // quietly turn the run green.
    if (!result.ok) {
      console.log(result.output);
      process.stdout.write('   retrying once\n');
      await resetPage(ws);
      result = await runFile(file, ws);
      if (result.ok) flaky.push(file);
    }

    console.log(result.output);
    if (!result.ok) failed += 1;
  }

  if (flaky.length) {
    console.log(`\nPassed only on retry: ${flaky.join(', ')}`);
  }

  browser.kill();
  killPort();
  rmSync(PROFILE, { recursive: true, force: true });
  console.log(failed === 0
    ? `\nAll ${SUITES.length} suites pass.`
    : `\n${failed} of ${SUITES.length} suites failed.`);
  process.exit(failed ? 1 : 0);
})();
