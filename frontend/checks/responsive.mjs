// Check §11: "Layout holds 360px -> 1920px with no horizontal scroll outside wide tables"
const [, , wsUrl] = process.argv;
const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();

function send(method, params = {}, sessionId) {
  const msgId = ++id;
  return new Promise((res) => {
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
}

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};

const PROBE = `(() => {
  const de = document.documentElement;
  const h = document.querySelector('header');
  const rail = document.querySelector('.reeyo-rail');
  const overflowing = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > window.innerWidth + 1) {
      overflowing.push((el.className || el.tagName).toString().slice(0, 40)
        + ' right=' + Math.round(r.right));
    }
  }
  return JSON.stringify({
    vw: window.innerWidth,
    docScrollW: de.scrollWidth,
    hasHScroll: de.scrollWidth > window.innerWidth,
    railVisible: rail ? Math.round(rail.getBoundingClientRect().right) > 0 : null,
    headerH: h ? Math.round(h.getBoundingClientRect().height) : null,
    overflowing: overflowing.slice(0, 6),
  });
})()`;

ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  const page = pages.find((t) => t.url.includes('localhost')) || pages[0];
  const { sessionId } = await send('Target.attachToTarget', {
    targetId: page.targetId, flatten: true,
  });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    return r && r.result ? r.result.value : null;
  };
  // Start from the app, not from whatever the previous suite left behind. The
  // runner blanks the page between suites, so every suite navigates itself.
  await send('Page.navigate', { url: 'http://localhost:5180/' }, sessionId);

  // French is the default (spec 2.1); these assertions are written in English.
  // Setting it before the app boots keeps the suite testing structure rather
  // than translation, which interactions.mjs covers on its own.
  await ev(`try { localStorage.setItem('reeyo.language', 'en'); } catch (e) {}`);
  await send('Page.reload', {}, sessionId);
  await wait(700);
  const readyBy = Date.now() + 45000;
  while (Date.now() < readyBy) {
    const painted = await ev(`document.body.innerText.includes('sample data')
      || !!document.querySelector('.reeyo-rail')`);
    if (painted === true) break;
    await wait(1000);
  }
  await ev(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('sample data'));
    if (b) b.click();
  })()`);
  await wait(2000);

  for (const width of [360, 420, 768, 860, 1080, 1440, 1920]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: 800, deviceScaleFactor: 1, mobile: false,
    }, sessionId);
    await new Promise((r) => setTimeout(r, 350));
    const res = await send('Runtime.evaluate', {
      expression: PROBE, returnByValue: true,
    }, sessionId);
    const d = JSON.parse(res.result.value);
    const flag = d.hasHScroll ? 'H-SCROLL' : 'ok';
    console.log(
      `${String(d.vw).padStart(5)}px  ${flag.padEnd(9)} scrollW=${d.docScrollW}` +
      (d.overflowing.length ? `  overflow: ${d.overflowing.join(' | ')}` : ''),
    );
  }
  ws.close();
  process.exit(0);
};
