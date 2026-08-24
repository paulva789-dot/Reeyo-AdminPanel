// The three restored capabilities: disputes, menu approvals, API keys.
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
  const a = [...document.querySelectorAll('a')].find(x => x.textContent.trim().startsWith('${label}'));
  if (!a) return null;
  const m = a.textContent.match(/${label}(\\d+)/);
  return m ? Number(m[1]) : 0;
})()`;
const go = (label) =>
  ev(`[...document.querySelectorAll('a')].find(a => a.textContent.trim().startsWith(${JSON.stringify(label)})).click()`);
const clickBtn = (text) =>
  ev(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true; })()`);
// A drawer and a modal can be open together, so always target the topmost
// dialog — the modal renders last.
const fillArea = (val) => ev(`(() => {
  const dialogs = [...document.querySelectorAll('[role=dialog]')];
  const top = dialogs[dialogs.length - 1];
  const t = (top && top.querySelector('textarea')) || document.querySelector('textarea');
  if (!t) return false;
  const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  set.call(t, ${JSON.stringify(val)});
  t.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
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
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('sample data')).click()`);
  await wait(2000);

  /* ---------------- Menu approvals ---------------- */
  await go('Approvals'); await wait(1300);
  const apprBefore = await ev(BADGE('Approvals'));
  check('approvals badge shows the waiting count', apprBefore > 0, String(apprBefore));

  await clickBtn('Approve'); await wait(800);
  const apprAfter = await ev(BADGE('Approvals'));
  check('approving decrements the Approvals badge', apprAfter === apprBefore - 1, `${apprBefore} -> ${apprAfter}`);
  check('approving fires a toast', await ev(`document.body.innerText.includes('approved')`));

  // Reject requires a reason before it will submit
  await clickBtn('Reject'); await wait(700);
  check('reject asks for a reason', await ev(`!!document.querySelector('[role=dialog]')`));
  await clickBtn('Reject change'); await wait(600);
  const blocked = await ev(`document.body.innerText.includes('Tell the vendor why')`);
  const stillOpen = await ev(`!!document.querySelector('[role=dialog]')`);
  check('reject without a reason is refused', blocked === true && stillOpen === true);
  await fillArea('Too steep for this category.');
  await wait(300);
  await clickBtn('Reject change'); await wait(800);
  const apprAfter2 = await ev(BADGE('Approvals'));
  check('rejecting with a reason decrements the badge', apprAfter2 === apprAfter - 1, `${apprAfter} -> ${apprAfter2}`);

  /* ---------------- Disputes ---------------- */
  await go('Disputes'); await wait(1300);
  const dispBefore = await ev(BADGE('Disputes'));
  check('disputes badge shows the open count', dispBefore > 0, String(dispBefore));

  await clickBtn('Open ticket'); await wait(800);
  check('dispute drawer opens with the conversation',
    await ev(`(() => { const d = document.querySelector('[role=dialog]'); return !!d && /conversation/i.test(d.innerText); })()`));

  await clickBtn('Resolve dispute'); await wait(700);
  const confirmResolve = `(() => {
    const b = [...document.querySelectorAll('[role=dialog] button')]
      .filter(x => x.textContent.trim() === 'Resolve dispute');
    if (!b.length) return false; b[b.length - 1].click(); return true;
  })()`;
  await ev(confirmResolve); await wait(500);
  check('resolve without saying what was done is refused',
    await ev(`document.body.innerText.includes('Say what was done')`));
  await fillArea('Refunded the delivery fee and spoke to the vendor.');
  await wait(300);
  await ev(confirmResolve); await wait(900);
  const dispAfter = await ev(BADGE('Disputes'));
  check('resolving decrements the Disputes badge', dispAfter === dispBefore - 1, `${dispBefore} -> ${dispAfter}`);

  /* ---------------- API keys ---------------- */
  await go('Settings'); await wait(1400);
  check('settings shows the API keys card',
    await ev(`document.body.innerText.includes('API keys')`));

  await clickBtn('New key'); await wait(700);
  await clickBtn('Create key'); await wait(500);
  check('creating without a name is refused',
    await ev(`document.body.innerText.includes('Give the key a name')`));

  await ev(`(() => {
    const i = document.querySelector('[role=dialog] input');
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(i, 'probe-key'); i.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await wait(300);
  await clickBtn('Create key'); await wait(500);
  check('creating without a scope is refused',
    await ev(`document.body.innerText.includes('Pick at least one scope')`));

  await ev(`[...document.querySelectorAll('[role=dialog] button')].find(b => b.textContent.trim() === 'orders:read').click()`);
  await wait(300);
  await clickBtn('Create key'); await wait(1200);
  const revealed = await ev(`(() => { const d = document.querySelector('[role=dialog]'); return d ? d.innerText : ''; })()`);
  check('the raw key is revealed exactly once',
    typeof revealed === 'string' && revealed.includes('never shown again'),
    revealed.split('\\n')[0]);
  await clickBtn('I have saved it'); await wait(700);
  check('the new key appears in the list',
    await ev(`document.body.innerText.includes('probe-key')`));

  await clickBtn('Revoke'); await wait(700);
  check('revoking asks to confirm and says it is permanent',
    await ev(`(() => { const d = document.querySelector('[role=dialog]'); return !!d && d.innerText.includes('cannot be undone'); })()`));
  await clickBtn('Revoke key'); await wait(800);
  check('revoking marks the key archived',
    await ev(`document.body.innerText.includes('revoked')`));

  console.log(failed === 0 ? '\nAll restored-capability checks pass.' : `\n${failed} failing.`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
