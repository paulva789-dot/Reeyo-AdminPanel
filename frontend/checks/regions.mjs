// The region scope: does picking one actually narrow the whole console, and
// does it ever hide work it should not?
const [, , wsUrl] = process.argv;
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
function send(m, p = {}, s) {
  const i = ++id;
  return new Promise((r) => { pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s })); });
}
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
let sessionId;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(x) {
  // A CDP command can come back as an error rather than a result (a destroyed
  // execution context, for one). Retry once, then give up quietly.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }, sessionId);
    if (r && r.exceptionDetails) return { error: r.exceptionDetails.text };
    if (r && r.result) return r.result.value;
    await wait(500);
  }
  return null;
}
let failed = 0;
function check(name, pass, detail = '') {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const go = (label) =>
  ev(`[...document.querySelectorAll('a')].find(a => a.textContent.trim().startsWith(${JSON.stringify(label)})).click()`);
const rowCount = () => ev(`document.querySelectorAll('table tbody tr').length`);
const pickRegion = (name) => ev(`(async () => {
  const pill = document.querySelector('.reeyo-location');
  if (!pill) return 'no pill';
  pill.click();
  await new Promise(r => setTimeout(r, 400));
  const opt = [...document.querySelectorAll('[role=option]')]
    .find(o => o.textContent.trim().startsWith(${JSON.stringify(name)}));
  if (!opt) return 'no option ' + ${JSON.stringify(name)};
  opt.click();
  return 'picked';
})()`);

ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  const page = pages.find((t) => t.url.includes('localhost')) || pages[0];
  ({ sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }));
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false }, sessionId);

  await send('Page.navigate', { url: 'http://localhost:5180/' }, sessionId);

  // French is the default (spec 2.1); these assertions are written in English.
  // Setting it before the app boots keeps the suite testing structure rather
  // than translation, which interactions.mjs covers on its own.
  await ev(`try { localStorage.setItem('reeyo.language', 'en'); } catch (e) {}`);
  await send('Page.reload', {}, sessionId);
  await wait(700);
  // Poll rather than guess: a cold Vite start compiles on demand, so how long
  // the first paint takes varies with the size of the app.
  const readyBy = Date.now() + 45000;
  let sampleBtn = null;
  while (Date.now() < readyBy) {
    sampleBtn = await ev(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('sample data'));
      return b ? 'ready' : null;
    })()`);
    if (sampleBtn === 'ready') break;
    if (await ev(`!!document.querySelector('.reeyo-rail')`)) { sampleBtn = 'already in'; break; }
    await wait(1000);
  }
  // UI-only mode boots straight into the console, so there is no button to
  // click. Guard rather than assume a sign-in screen exists.
  await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('sample data'));
    if (b) b.click();
  })()`);
  await wait(2000);

  // The picker offers every region, defaulting to the whole country.
  await ev(`document.querySelector('.reeyo-location').click()`);
  await wait(500);
  const options = await ev(`[...document.querySelectorAll('[role=option]')].map(o => o.textContent.trim().split('\\n')[0])`);
  check('picker defaults to all regions',
    await ev(`document.querySelector('.reeyo-location').textContent.includes('All regions')`));
  check('picker lists all ten regions plus the national option',
    Array.isArray(options) && options.length === 11, `${options.length} options`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId);
  await wait(400);

  /* ---- Orders scope ---- */
  await go('Orders'); await wait(1300);
  const allOrders = await rowCount();
  await pickRegion('Littoral'); await wait(1200);
  const littoral = await rowCount();
  check('choosing a region narrows the order list', littoral > 0 && littoral < allOrders,
    `${allOrders} nationwide -> ${littoral} in Littoral`);
  const zonesShown = await ev(`[...document.querySelectorAll('table tbody tr')].every(r => /Littoral/.test(r.innerText))`);
  check('every remaining order is in that region', zonesShown === true);

  /* ---- The scope carries across pages ---- */
  await go('Riders'); await wait(1200);
  const ridersScoped = await ev(`[...document.querySelectorAll('table tbody tr')].every(r => /Littoral/.test(r.innerText))`);
  check('the same scope applies on another page', ridersScoped === true);

  await go('Vendors'); await wait(1200);
  const vendorsScoped = await ev(`[...document.querySelectorAll('table tbody tr')].every(r => /Littoral/.test(r.innerText))`);
  check('vendors are scoped too', vendorsScoped === true);

  /* ---- Badges follow the scope ---- */
  const badgeScoped = await ev(`(() => {
    const a = [...document.querySelectorAll('a')].find(x => x.textContent.trim().startsWith('Orders'));
    const m = a && a.textContent.match(/Orders(\\d+)/);
    return m ? Number(m[1]) : null;
  })()`);
  await pickRegion('All regions'); await wait(1200);
  const badgeAll = await ev(`(() => {
    const a = [...document.querySelectorAll('a')].find(x => x.textContent.trim().startsWith('Orders'));
    const m = a && a.textContent.match(/Orders(\\d+)/);
    return m ? Number(m[1]) : null;
  })()`);
  check('the sidebar badge reflects the scope', badgeScoped !== null && badgeAll > badgeScoped,
    `${badgeScoped} in Littoral vs ${badgeAll} nationwide`);

  /* ---- A region with no activity is honest about it ---- */
  await go('Orders'); await wait(900);
  await pickRegion('East'); await wait(1200);
  const emptyState = await ev(`document.body.innerText.includes('No order matches that filter')
    || document.querySelectorAll('table tbody tr').length === 0`);
  check('a region with no orders shows an empty state, not a broken table', emptyState === true);

  /* ---- Dispatch groups zone capacity by region ----
     The Zones tab is now the real /logistics/zones editor, which is a map and
     a flat list. The region-grouped view is Capacity. */
  await pickRegion('All regions'); await wait(900);
  await go('Dispatch'); await wait(1200);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Capacity').click()`);
  await wait(1000);
  const grouped = await ev(`[...document.querySelectorAll('h2')].map(h => h.textContent.trim())`);
  check('zone capacity is grouped under region headings',
    Array.isArray(grouped) && grouped.includes('Littoral') && grouped.includes('Southwest'),
    Array.isArray(grouped) ? grouped.slice(0, 5).join(', ') : String(grouped));

  console.log(failed === 0 ? '\nAll region checks pass.' : `\n${failed} failing.`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
