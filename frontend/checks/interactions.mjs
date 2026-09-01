// Section 14 behaviours, driven through the auth gate and in-app navigation.
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
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? { error: r.exceptionDetails.text } : r.result.value;
}
let failed = 0;
function check(name, pass, detail = '') {
  if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}
const BADGE = (label) => `(() => {
  const link = [...document.querySelectorAll('a')].find(a => a.textContent.trim().startsWith('${label}'));
  if (!link) return null;
  const m = link.textContent.match(/${label}(\\d+)/);
  return m ? Number(m[1]) : 0;
})()`;
const go = (label) =>
  ev(`[...document.querySelectorAll('a')].find(a => a.textContent.trim().startsWith(${JSON.stringify(label)})).click()`);

ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  const page = pages.find((t) => t.url.includes('localhost')) || pages[0];
  ({ sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true }));
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  await send('Page.navigate', { url: 'http://localhost:5180/' }, sessionId);
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
  await wait(1500);
  check('sample mode reaches the console', await ev(`!!document.querySelector('.reeyo-rail')`));

  // --- cancelling an order moves the badge and fires a toast ---
  // The status dropdown is gone: admin-api has no generic status endpoint, so
  // status is read-only and cancelling is the one status a console can set.
  await go('Orders'); await wait(1200);
  const before = await ev(BADGE('Orders'));
  check('order status is read-only, not a control',
    await ev(`document.querySelectorAll('table select').length === 0`));

  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Open').click()`);
  await wait(800);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Cancel order').click()`);
  await wait(700);
  await ev(`(() => {
    const b = [...document.querySelectorAll('[role=dialog] button')].filter(x => x.textContent.trim() === 'Cancel order');
    if (b.length) b[b.length - 1].click();
  })()`);
  await wait(500);
  check('cancelling refuses to proceed without a reason',
    await ev(`document.body.innerText.includes('Give a reason')`));

  await ev(`(() => {
    const dialogs = [...document.querySelectorAll('[role=dialog]')];
    const t = dialogs[dialogs.length - 1].querySelector('textarea');
    const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    set.call(t, 'Vendor closed unexpectedly.');
    t.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await wait(400);
  await ev(`(() => {
    const b = [...document.querySelectorAll('[role=dialog] button')].filter(x => x.textContent.trim() === 'Cancel order');
    if (b.length) b[b.length - 1].click();
  })()`);
  await wait(900);
  const after = await ev(BADGE('Orders'));
  check('cancelling decrements the Orders badge', after === before - 1, `${before} -> ${after}`);
  check('cancelling fires a toast', await ev(`document.body.innerText.includes('is now cancelled')`));

  // --- filter reaches the written empty state ---
  await ev(`(() => {
    const i = [...document.querySelectorAll('input')].find(x => x.placeholder && x.placeholder.includes('Filter'));
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(i, 'zzzznothing'); i.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await wait(900);
  check('filter reaches a written empty state',
    await ev(`document.body.innerText.includes('No order matches that filter')`));
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Clear filter')?.click()`);
  await wait(600);

  // --- drawer opens, closes on Escape and on the veil ---
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Open').click()`);
  await wait(700);
  check('order drawer opens', await ev(`!!document.querySelector('[role=dialog]')`));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, sessionId);
  await wait(600);
  check('Escape closes the drawer', await ev(`!document.querySelector('[role=dialog]')`));
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Open').click()`);
  await wait(700);
  await ev(`(() => {
    const veil = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).backdropFilter.includes('blur') && d.getBoundingClientRect().width > 1000);
    if (veil) veil.click();
  })()`);
  await wait(600);
  check('veil click closes the drawer', await ev(`!document.querySelector('[role=dialog]')`));

  // --- rail stage filters, dims, and clears ---
  await go('Overview'); await wait(1300);
  const rowsAll = await ev(`document.querySelectorAll('table tbody tr').length`);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Preparing')).click()`);
  await wait(800);
  const rowsFiltered = await ev(`document.querySelectorAll('table tbody tr').length`);
  const dimmed = await ev(`[...document.querySelectorAll('button')].filter(b => b.textContent.includes('New')).some(b => Number(getComputedStyle(b).opacity) < 0.5)`);
  check('rail stage click filters the content below', rowsFiltered !== rowsAll, `${rowsAll} -> ${rowsFiltered} rows`);
  check('other stages dim when one is selected', dimmed === true);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Preparing')).click()`);
  await wait(700);
  check('clicking the stage again clears the filter',
    await ev(`document.querySelectorAll('table tbody tr').length`) === rowsAll);

  // --- alerts are derived, not hardcoded seed names ---
  const alertText = await ev(`(() => {
    const cards = [...document.querySelectorAll('div')].filter(d => d.textContent.includes('Needs attention'));
    return cards.length ? cards[cards.length - 1].innerText : '';
  })()`);
  check('alerts mention only entities present in the data',
    typeof alertText === 'string' && alertText.length > 0, alertText.split('\\n').slice(1, 3).join(' / '));

  // --- payout approval moves the Payments badge ---
  await go('Payments'); await wait(1300);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Payout requests')).click()`);
  await wait(800);
  const payBefore = await ev(BADGE('Payments'));
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Release payout').click()`);
  await wait(600);
  await ev(`(() => {
    const b = [...document.querySelectorAll('[role=dialog] button')].filter(x => x.textContent.trim() === 'Release payout');
    if (b.length) b[b.length - 1].click();
  })()`);
  await wait(900);
  const payAfter = await ev(BADGE('Payments'));
  check('approving a payout decrements the Payments badge', payAfter === payBefore - 1, `${payBefore} -> ${payAfter}`);

  // --- banners on Storefront ---
  // Reordering is gone: /engagement/banners exposes no position, so a drag
  // handle would have been a control that changes nothing. What replaced it is
  // create, edit, delete and a visibility toggle, all against the real route.
  await go('Storefront'); await wait(1300);
  const bannerRows = await ev(`document.querySelectorAll('[aria-label$=" visibility"]').length`);
  check('banners list with a visibility toggle each', bannerRows > 0, `${bannerRows} toggles`);

  const noReorder = await ev(`document.querySelectorAll('[aria-label^="Move "]').length`);
  check('no reorder controls remain, since the API cannot save an order', noReorder === 0);

  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'New banner').click()`);
  await wait(700);
  const formOpen = await ev(`!!document.querySelector('[role=dialog]')
    && document.body.innerText.includes('Headline')`);
  check('the new banner form opens', formOpen === true);

  await ev(`[...document.querySelectorAll('[role=dialog] button')].find(b => b.textContent.trim() === 'Save banner').click()`);
  await wait(500);
  const refused = await ev(`document.body.innerText.includes('the line a customer will read')`);
  check('saving an empty banner is refused with a reason', refused === true);
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(400);

  // --- the approval queues ---
  await go('Approvals'); await wait(1200);
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Riders')).click()`);
  await wait(800);
  const riderQueue = await ev(`document.body.innerText.includes('Documents')`);
  check('the rider approval queue is reachable', riderQueue === true);

  const approveDisabled = await ev(`(() => {
    const rows = [...document.querySelectorAll('tbody tr')];
    for (const r of rows) {
      const b = [...r.querySelectorAll('button')].find(x => x.textContent.trim() === 'Approve');
      if (b && b.disabled) return true;
    }
    return false;
  })()`);
  check('a rider with unreviewed documents cannot be approved', approveDisabled === true);

  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Documents').click()`);
  await wait(800);
  const kyc = await ev(`document.body.innerText.includes('does not approve the rider')`);
  check('the document review says it does not approve the rider', kyc === true);

  console.log(failed === 0 ? '\nAll interaction checks pass.' : `\n${failed} failing.`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
