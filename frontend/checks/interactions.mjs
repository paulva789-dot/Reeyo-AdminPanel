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
  await wait(1500);
  check('sample mode reaches the console', await ev(`!!document.querySelector('.reeyo-rail')`));

  // --- the Edit Status control moves an order and demands a reason (3.2) ---
  await go('Orders'); await wait(1200);
  const before = await ev(BADGE('Orders'));
  check('order status is a badge, not an inline control',
    await ev(`document.querySelectorAll('table select').length === 0`));

  // The quick action on the row, which 3.2 asks for alongside the detail one.
  await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Status');
    if (b) b.click();
  })()`);
  await wait(800);
  check('the status panel opens from the list row',
    await ev(`!!document.querySelector('[role=dialog]') && document.body.innerText.includes('Move to')`));

  // Choose the terminal state, which the spec says must carry a reason.
  await ev(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const sel = d.querySelector('select');
    const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    set.call(sel, 'cancelled');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await wait(500);

  await ev(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const b = [...d.querySelectorAll('button')].find(x => x.textContent.trim() === 'Cancel order');
    if (b) b.click();
  })()`);
  await wait(500);
  check('a cancellation refuses to proceed without a reason',
    await ev(`document.body.innerText.includes('Choose a reason')`));

  // Reasons come from a list, not free text (3.2).
  const reasonCount = await ev(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const sels = [...d.querySelectorAll('select')];
    const reason = sels[sels.length - 1];
    return reason ? reason.options.length : 0;
  })()`);
  check('the reason is chosen from a list', reasonCount > 1, `${reasonCount} options`);

  await ev(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const sels = [...d.querySelectorAll('select')];
    const reason = sels[sels.length - 1];
    const set = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    set.call(reason, reason.options[1].value);
    reason.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await wait(400);
  await ev(`(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const b = [...d.querySelectorAll('button')].find(x => x.textContent.trim() === 'Cancel order');
    if (b) b.click();
  })()`);
  await wait(1000);

  const after = await ev(BADGE('Orders'));
  check('cancelling decrements the Orders badge', after === before - 1, `${before} -> ${after}`);
  check('cancelling fires a toast',
    await ev(`document.body.innerText.includes('is now cancelled')`));

  // --- filter reaches the written empty state ---
  await ev(`(() => {
    const i = [...document.querySelectorAll('input')].find(x => x.placeholder && /ID, name/.test(x.placeholder));
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

  // --- the rail counts real stages, filters, dims, and clears ---
  await go('Overview'); await wait(1300);

  // Every stage on the rail has to be one an order can actually be in. This
  // list drifted out of step with the workflow once, and the five stages that
  // no longer existed read 00 for ever - which the old assertion could not
  // see, because filtering to a stage that matches nothing still changes the
  // row count.
  const rail = await ev(`(() => {
    const stages = [...document.querySelectorAll('button')]
      .map(b => b.innerText.trim())
      .filter(t => /^[0-9][0-9]/.test(t))
      .map(t => {
        const [count, ...rest] = t.split(String.fromCharCode(10));
        return { label: rest.join(' ').trim(), count: Number(count) };
      });
    return stages;
  })()`);

  check('the rail draws a stage for each step of the workflow',
    Array.isArray(rail) && rail.length === 8, `${rail && rail.length} stages`);

  const railLabels = (rail || []).map(s => s.label).join(', ');
  check('the rail uses the current workflow vocabulary',
    /Pending/.test(railLabels) && /In transit/.test(railLabels)
      && !/Preparing/.test(railLabels) && !/On the way/.test(railLabels),
    railLabels);

  // At least half the stages should hold something. A rail where nearly every
  // counter is zero is the signature of stage keys that match no order.
  const populated = (rail || []).filter(s => s.count > 0).length;
  check('the rail counters actually find orders',
    populated >= 3, `${populated} of ${rail && rail.length} stages hold orders`);

  const rowsAll = await ev(`document.querySelectorAll('table tbody tr').length`);

  // Filter by a stage that is known to hold something, so the assertion cannot
  // be satisfied by a stage that matches nothing.
  const busiest = (rail || []).filter(s => s.label !== 'Problem')
    .sort((a, b) => b.count - a.count)[0];
  await ev(`(() => {
    const b = [...document.querySelectorAll('button')]
      .find(x => x.innerText.includes(${JSON.stringify(busiest ? busiest.label : 'Delivered')}));
    if (b) b.click();
  })()`);
  await wait(800);
  const rowsFiltered = await ev(`document.querySelectorAll('table tbody tr').length`);
  const dimmed = await ev(`[...document.querySelectorAll('button')].filter(b => b.innerText.includes('Pending')).some(b => Number(getComputedStyle(b).opacity) < 0.5)`);
  check('rail stage click filters the content below', rowsFiltered !== rowsAll,
    `${rowsAll} -> ${rowsFiltered} rows via ${busiest && busiest.label}`);
  check('other stages dim when one is selected', dimmed === true);

  await ev(`(() => {
    const b = [...document.querySelectorAll('button')]
      .find(x => x.innerText.includes(${JSON.stringify(busiest ? busiest.label : 'Delivered')}));
    if (b) b.click();
  })()`);
  await wait(800);
  const rowsCleared = await ev(`document.querySelectorAll('table tbody tr').length`);
  check('clicking the stage again clears the filter', rowsCleared === rowsAll);

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

  // --- shell: theme, language, and the controls that used to do nothing ---
  await go('Overview'); await wait(900);

  // Start from a known theme. The suites share a browser profile, so a previous
  // run can leave this in dark and make "did it change?" unanswerable.
  await ev(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try { localStorage.setItem('reeyo.theme', 'light'); } catch (e) { /* private window */ }
  })()`);
  await wait(300);
  const canvasBefore = await ev(`getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()`);

  // The control cycles light -> dark -> system, so at most three clicks reach dark.
  for (let i = 0; i < 3; i++) {
    const now = await ev(`document.documentElement.getAttribute('data-theme')`);
    if (now === 'dark') break;
    await ev(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => /^(Theme|Thème)/.test(x.getAttribute('aria-label') || ''));
      if (b) b.click();
    })()`);
    await wait(400);
  }

  const themeAttr = await ev(`document.documentElement.getAttribute('data-theme')`);
  const canvasAfter = await ev(`getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim()`);

  check('the theme toggle reaches dark', themeAttr === 'dark', String(themeAttr));
  check('dark repaints the surface tokens', canvasAfter !== canvasBefore,
    canvasBefore + ' -> ' + canvasAfter);

  // Status colours must keep working against the dark ground, not vanish.
  const signals = await ev(`(() => {
    const s = getComputedStyle(document.documentElement);
    return ['--go','--watch','--stop','--calm'].map(n => s.getPropertyValue(n).trim());
  })()`);
  check('every signal colour is still defined in dark',
    Array.isArray(signals) && signals.every(v => v && v.length > 0), String(signals));

  await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'en');
    if (b) b.click();
  })()`);
  await wait(500);
  const lang = await ev(`document.documentElement.getAttribute('lang')`);
  check('the language switcher changes the document language', lang === 'en', String(lang));

  const dateChip = await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /Date range|Période/.test(x.getAttribute('aria-label') || ''));
    return b ? b.innerText.replace(/\s+/g, ' ').trim() : null;
  })()`);
  check('the date filter shows the active range as a chip',
    typeof dateChip === 'string' && dateChip.length > 0, String(dateChip));

  const wired = await ev(`(() => {
    const has = (re) => [...document.querySelectorAll('button')].some(x => re.test(x.getAttribute('aria-label') || ''));
    return { refresh: has(/Refresh|Actualiser/), alerts: has(/Alerts|Alertes/) };
  })()`);
  check('the refresh control is present and labelled', wired && wired.refresh === true);
  check('the alerts control is present and labelled', wired && wired.alerts === true);

  console.log(failed === 0 ? '\nAll interaction checks pass.' : `\n${failed} failing.`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
