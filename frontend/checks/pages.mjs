// Enter sample mode once, then walk the console via in-app navigation
// (state is in-memory by spec, so a full page load would reset it).
import { writeFileSync } from 'node:fs';

const [, , wsUrl, outDir] = process.argv;
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
let logs = [];

function send(m, p = {}, s) {
  const i = ++id;
  return new Promise((r) => { pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p, sessionId: s })); });
}
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
    logs.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
  if (m.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + m.params.exceptionDetails.text);
};

const NAV = [
  ['Overview', 'overview'], ['Orders', 'orders'], ['Dispatch', 'dispatch'],
  ['Disputes', 'disputes'], ['Vendors', 'vendors'], ['Approvals', 'approvals'],
  ['Riders', 'riders'], ['Customers', 'customers'],
  ['Storefront', 'storefront'], ['Marketing', 'marketing'],
  ['Payments', 'payments'], ['Analytics', 'analytics'], ['Settings', 'settings'],
];

const PROBE = `(() => {
  const de = document.documentElement;
  const main = document.querySelector('main');
  const problems = [];
  for (const el of document.querySelectorAll('button, [role=switch], input, select')) {
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
      || el.getAttribute('placeholder') || '';
    if (!name) problems.push('unnamed <' + el.tagName.toLowerCase() + '>');
  }
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) problems.push('h1 count = ' + h1);
  const body = document.body.innerText;
  if (/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]/u.test(body)) problems.push('emoji');
  if (/lorem ipsum|coming soon/i.test(body)) problems.push('placeholder copy');
  if (body.includes('!')) problems.push('exclamation mark');
  return JSON.stringify({
    hScroll: de.scrollWidth > window.innerWidth,
    text: (main ? main.innerText : '').trim().length,
    problems: [...new Set(problems)],
    inConsole: !!document.querySelector('.reeyo-rail'),
    heading: (document.querySelector('h1') || {}).innerText || '',
  });
})()`;

let sessionId;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  return r.exceptionDetails ? { error: r.exceptionDetails.text } : r.result.value;
}

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
  const entered = await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('sample data'));
    if (!b) return 'no sample button found';
    b.click(); return 'clicked';
  })()`);
  await wait(2000);
  const inside = await ev(`!!document.querySelector('.reeyo-rail')`);
  if (!inside) {
    console.log(`ABORT: never reached the console (${entered})`);
    process.exit(1);
  }

  let fails = 0;
  for (const [label, name] of NAV) {
    logs = [];
    await ev(`[...document.querySelectorAll('a')].find(a => a.textContent.trim().startsWith(${JSON.stringify(label)})).click()`);
    await wait(1100);
    const d = JSON.parse(await ev(PROBE));
    const flags = [];
    if (!d.inConsole) flags.push('NOT-IN-CONSOLE');
    const h = d.heading.trim().toLowerCase();
    if (h !== label.toLowerCase()
        && !(label === 'Dispatch' && h.includes('dispatch'))
        && !(label === 'Approvals' && h.includes('approval'))) {
      flags.push(`WRONG-PAGE(h1="${d.heading}")`);
    }
    if (d.hScroll) flags.push('H-SCROLL');
    if (d.text < 40) flags.push(`NEARLY-EMPTY(${d.text})`);
    if (d.problems.length) flags.push(d.problems.join(', '));
    if (logs.length) flags.push(logs.join(' | '));
    if (flags.length) fails++;
    console.log(`${label.padEnd(11)} ${flags.length ? 'FAIL  ' + flags.join('  ') : 'ok'}`);
    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(`${outDir}/s-${name}.png`, Buffer.from(shot.data, 'base64'));
  }
  console.log(fails === 0 ? '\nAll pages clean.' : `\n${fails} page(s) with findings.`);
  ws.close();
  process.exit(0);
};
