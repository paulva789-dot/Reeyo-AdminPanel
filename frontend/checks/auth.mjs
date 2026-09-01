// End-to-end auth flow against the real backend.
//
// VITE_UI_ONLY removes the sign-in gate on purpose, so this suite has nothing
// to test in that mode. It skips on the *configuration* rather than on what the
// page looks like: "no sign-in screen appeared" is also what a completely
// broken gate looks like, and this suite exists to catch exactly that.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const uiOnly = ['.env.local', '.env'].some((f) => {
  const path = join(ROOT, f);
  return existsSync(path)
    && /^\s*VITE_UI_ONLY\s*=\s*true\s*$/m.test(readFileSync(path, 'utf8'));
});

if (uiOnly) {
  console.log('SKIP  VITE_UI_ONLY=true removes the sign-in gate, so there is none to test.');
  console.log('      Unset it in frontend/.env.local to run these checks.');
  process.exit(0);
}

const [, , wsUrl] = process.argv;
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const requests = [];
const sent = [];

function send(m, p = {}, s) {
  const i = ++id;
  return new Promise((r) => { pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s })); });
}
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  // Both are needed. A request the app aborts — /auth/me hitting its 8s timeout
  // against a slow backend — never produces a response, only a failure, so
  // listening for responses alone made a real call invisible and the check
  // failed intermittently for reasons that had nothing to do with the app.
  if (m.method === 'Network.requestWillBeSent') {
    const u = m.params.request.url;
    if (u.includes('/api/v1/')) sent.push(u.replace(/^https?:\/\/[^/]+/, ''));
  }
  if (m.method === 'Network.responseReceived') {
    const u = m.params.response.url;
    if (u.includes('/api/v1/')) requests.push(`${m.params.response.status} ${u.replace(/^https?:\/\/[^/]+/, '')}`);
  }
};

let sessionId;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r && r.exceptionDetails) return { error: r.exceptionDetails.text };
  return r && r.result ? r.result.value : null;
}
let failed = 0;
function check(name, pass, detail = '') {
  if (!pass) failed += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const setVal = (sel, val) => `(() => {
  const el = document.querySelector('${sel}');
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(el, ${JSON.stringify(val)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`;

ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  const page = pages.find((t) => t.url.includes('localhost')) || pages[0];
  ({ sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }));
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Network.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  // --- Gate: protected route must not render while signed out ---
  // Stamp the current document first. Polling for content alone matched the
  // previous page still on screen, so the checks ran before navigation and
  // reported failures that were purely the harness racing itself.
  await ev(`window.__before = true`);
  await send('Page.navigate', { url: 'http://localhost:5180/payments' }, sessionId);

  // Wait for the sign-in form itself, not for text. #email exists only on the
  // gate, so it cannot match a stale page, and it appears only once the session
  // check has settled — which is exactly the state these checks assume.
  const readyBy = Date.now() + 60000;
  while (Date.now() < readyBy) {
    const fresh = await ev(`typeof window.__before === 'undefined'`);
    if (fresh === true) {
      const settled = await ev(`!!document.querySelector('#email')
        || !!document.querySelector('.reeyo-rail')`);
      if (settled === true) break;
    }
    await wait(500);
  }
  const onLogin = await ev(`document.body.innerText.includes('Sign in')`);
  const noRail = await ev(`!document.querySelector('.reeyo-rail')`);
  check('protected route redirects to sign in', onLogin === true && noRail === true);
  // Observing /auth/me on the first load is a race: the request can be issued
  // before network instrumentation is fully live on this session. Reload now
  // that the page is settled and capture is definitely running, so the check
  // tests the app's behaviour rather than the harness's timing.
  requests.length = 0;
  sent.length = 0;
  await send('Page.reload', {}, sessionId);
  const seenBy = Date.now() + 30000;
  while (Date.now() < seenBy && !sent.some((u) => u.includes('/auth/me'))) {
    await wait(500);
  }
  check(
    'session check hits /auth/me',
    sent.some((u) => u.includes('/auth/me')),
    sent.filter((u) => u.includes('auth')).join(', ') || 'no auth calls seen',
  );

  // Back to a settled gate before the sign-in checks below.
  const settledBy = Date.now() + 60000;
  while (Date.now() < settledBy) {
    if (await ev(`!!document.querySelector('#email')`)) break;
    await wait(500);
  }

  // --- Validation before any network call ---
  requests.length = 0;
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sign in').click()`);
  await wait(600);
  const validation = await ev(`document.body.innerText.includes('Enter your email and password')`);
  check('empty submit is caught client-side', validation === true, `${requests.length} network calls made`);

  // --- Real credentials attempt: must reach the backend and surface its answer ---
  requests.length = 0;
  sent.length = 0;
  await ev(setVal('#email', 'audit-probe@reeyo.com'));
  await ev(setVal('#password', 'deliberately-wrong-password'));
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Sign in').click()`);
  // Poll for the outcome: the round trip to a remote backend is not a fixed
  // cost, and a sleep that is usually long enough fails as a false negative.
  const answerBy = Date.now() + 25000;
  while (Date.now() < answerBy) {
    if (requests.some((r) => r.includes('/auth/login'))) break;
    await wait(500);
  }
  await wait(1200);
  const hitLogin = requests.some((r) => r.includes('/auth/login'))
    || sent.some((u) => u.includes('/auth/login'));
  const errShown = await ev(`(() => { const el = document.querySelector('[role=alert]'); return el ? el.innerText : null; })()`);
  check('sign in reaches the real backend', hitLogin,
    requests.join(', ') || sent.join(', ') || 'no /api calls seen');

  // Not just "an error appeared": the request has to have been answered by the
  // admin-api itself. This check used to pass on a 500 from the dev proxy with
  // nothing behind it, which is how a completely broken sign-in went unnoticed
  // — the screen said "Internal Server Error" and the suite called it a
  // backend rejection.
  const loginStatus = requests.find((r) => r.includes('/auth/login'));
  check('the backend answered, rather than a proxy failing in front of it',
    typeof loginStatus === 'string' && loginStatus.startsWith('401'),
    loginStatus || 'no /auth/login response seen');

  // The console rewrites AUTH_TOKEN_INVALID into something that tells the user
  // what to do, so this asserts the meaning rather than the API's wording: a
  // credentials problem, and specifically not an infrastructure failure
  // wearing a credentials failure's clothes.
  check('the rejection reads as wrong credentials, not a broken server',
    typeof errShown === 'string'
      && /password|credential/i.test(errShown)
      && !/internal server error|did not answer|could not reach/i.test(errShown),
    errShown || 'no alert rendered');

  // --- Sample mode: no network, banner shown, rail appears ---
  requests.length = 0;
  sent.length = 0;
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('sample data')).click()`);
  await wait(1500);
  const inApp = await ev(`!!document.querySelector('.reeyo-rail')`);
  const banner = await ev(`document.body.innerText.includes('Sample data')`);
  check('sample mode enters the console', inApp === true);
  check('sample mode is labelled on screen', banner === true);
  check('sample mode makes no API calls', sent.length === 0, `${sent.length} calls`);

  // --- Sign out returns to the gate ---
  await ev(`document.querySelector('[aria-label="Sign out"]').click()`);
  await wait(1200);
  const backToLogin = await ev(`document.body.innerText.includes('Sign in') && !document.querySelector('.reeyo-rail')`);
  check('sign out returns to the sign in screen', backToLogin === true);

  console.log(failed === 0 ? '\nAll auth checks pass.' : `\n${failed} failing.`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
