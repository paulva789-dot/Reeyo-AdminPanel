// Exercise the real modules through the dev server, including the empty and
// malformed cases live data can produce but the seed never does.
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

const SUITE = `(async () => {
  const ins = await import('/src/lib/insights.ts?t=' + Date.now());
  const ad  = await import('/src/services/adapters.ts?t=' + Date.now());
  const fmt = await import('/src/lib/format.ts?t=' + Date.now());
  const out = [];
  const eq = (name, got, want) => out.push({
    name, pass: JSON.stringify(got) === JSON.stringify(want), got, want,
  });
  const ok = (name, cond, got) => out.push({ name, pass: !!cond, got });

  // --- empty platform: no invented problems, no NaN ---
  eq('alerts on empty data', ins.deriveAlerts([], [], [], []), []);
  eq('grossValue of nothing', ins.grossValue([]), 0);
  eq('cancelRate of nothing', ins.cancelRate([]), 0);
  eq('averageBasket of nothing', ins.averageBasket([]), 0);
  eq('averageEta of nothing', ins.averageEta([]), null);
  eq('ratingAverage of nothing', ins.ratingAverage([]), null);
  eq('revenueByVertical of nothing', ins.revenueByVertical([]), []);
  eq('deliveryByZone of nothing', ins.deliveryByZone([]), []);
  eq('topVendors of nothing', ins.topVendorsByRevenue([]), []);

  // all-cancelled must not divide by zero
  const cancelled = [{ id:'X', vertical:'food', status:'cancelled', total:100, zone:'Muea', eta:'done', rider:null }];
  eq('averageBasket when everything cancelled', ins.averageBasket(cancelled), 0);
  eq('cancelRate when everything cancelled', ins.cancelRate(cancelled), 100);
  eq('cancelled orders earn no revenue', ins.revenueByVertical(cancelled), []);

  // --- pluralisation ---
  eq('plural of one', ins.plural(1, 'order'), '1 order');
  eq('plural of many', ins.plural(3, 'order'), '3 orders');
  eq('plural of zero', ins.plural(0, 'order'), '0 orders');

  // --- alerts name only entities that exist ---
  const alerts = ins.deriveAlerts(
    [{ id:'F-1', status:'delayed', zone:'Muea', rider:'R', vertical:'food', total:1, eta:'late 3 min' }],
    [{ id:'V1', name:'Testable Vendor', status:'suspended', vertical:'food', revenue:0, rating:0, orders:0 }],
    [{ id:'R1', name:'Slow Rider', rating:3.1, trips:7, state:'idle' }],
    [],
  );
  const text = alerts.map(a => a.text).join(' | ');
  ok('alert names the real suspended vendor', text.includes('Testable Vendor'), text);
  ok('alert names the real low-rated rider', text.includes('Slow Rider'), text);
  ok('no seed names leak into alerts',
     !/Fresh Corner|Mama Grill|Blaise Fon/.test(text), text);
  ok('single late order is singular', text.includes('1 order running late'), text);

  // --- adapters survive junk ---
  eq('adaptOrder on an empty object keeps a usable shape',
     typeof ad.adaptOrder({}).id, 'string');
  eq('unknown status falls back to new', ad.toOrderStatus('WHO_KNOWS'), 'new');
  eq('SCREAMING_SNAKE maps through', ad.toOrderStatus('OUT_FOR_DELIVERY'), 'on the way');
  eq('COMPLETED maps to delivered', ad.toOrderStatus('COMPLETED'), 'delivered');
  eq('vertical falls back to the id prefix', ad.toVertical(undefined, 'P-0001'), 'parcel');
  eq('a known zone resolves to its city and region',
     ad.toPlacement({ zone: 'Akwa' }), { zone: 'Akwa', city: 'Douala', region: 'Littoral' });
  eq('a city alone still resolves a region',
     ad.toPlacement({ city: 'Bamenda' }).region, 'Northwest');
  eq('an unknown place is kept, not dropped',
     ad.toPlacement({ zone: 'Atlantis' }).zone, 'Atlantis');
  eq('toArray unwraps {data:{items}}', ad.toArray({ items: [1, 2] }), [1, 2]);
  eq('toArray on junk is empty', ad.toArray('nope'), []);
  eq('negative eta reads as late', ad.toEta(-14, 'on the way'), 'late 14 min');
  eq('delivered ignores eta', ad.toEta(99, 'delivered'), 'done');

  // --- money formatting: thin space, never a comma ---
  const m = fmt.money(2140000);
  ok('money groups with a thin space', m === '2\\u202f140\\u202f000', m);
  ok('money never uses a comma', !m.includes(','), m);
  eq('money of zero', fmt.money(0), '0');
  eq('money of a negative', fmt.money(-1500), '-1\\u202f500');

  return JSON.stringify(out);
})()`;

ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const pages = targetInfos.filter((t) => t.type === 'page');
  const page = pages.find((t) => t.url.includes('localhost')) || pages[0];
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);

  // The suite imports the app's own modules, so the page has to be on the app
  // origin first; from about:blank those imports cannot resolve.
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await send('Page.navigate', { url: 'http://localhost:5180/' }, sessionId);
  const readyBy = Date.now() + 45000;
  while (Date.now() < readyBy) {
    const res = await send('Runtime.evaluate', {
      expression: `location.origin.includes('localhost') && document.readyState === 'complete'`,
      returnByValue: true,
    }, sessionId);
    if (res && res.result && res.result.value === true) break;
    await wait(1000);
  }

  const r = await send('Runtime.evaluate', { expression: SUITE, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) {
    console.log('EXCEPTION: ' + r.exceptionDetails.text + ' ' +
      (r.exceptionDetails.exception?.description || ''));
    process.exit(1);
  }
  const results = JSON.parse(r.result.value);
  let failed = 0;
  for (const t of results) {
    if (!t.pass) failed++;
    console.log(`${t.pass ? 'PASS' : 'FAIL'}  ${t.name}` +
      (t.pass ? '' : `\n        got ${JSON.stringify(t.got)}` +
        (t.want !== undefined ? ` want ${JSON.stringify(t.want)}` : '')));
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  ws.close();
  process.exit(failed ? 1 : 0);
};
