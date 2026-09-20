// A pinned stage is sticky at top:0. If it is TALLER than the viewport its
// own top edge is unreachable, so the first lines of its heading can never
// be read -- that is what truncated "...them require a lawyer."
// BREAK=stage -> force the closing stage taller than the viewport.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE);
const base = process.argv[2] || 'http://localhost:4700/dossier/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
for (const vp of [[390,844],[414,896],[360,780],[768,1024],[1440,900]]) {
  const p = await b.newPage({ viewport: { width: vp[0], height: vp[1] } });
  await p.goto(base, { waitUntil: 'networkidle' });
  if (process.env.BREAK === 'stage') await p.addStyleTag({ content: '.close{height:1400px !important}' });
  await p.waitForTimeout(150);
  const over = await p.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll('.sc-stage')) {
      const h = s.getBoundingClientRect().height;
      if (h > innerHeight + 2) out.push((s.className || 'stage') + ' ' + Math.round(h) + '>' + innerHeight);
    }
    return out;
  });
  ok(over.length === 0, vp.join('x') + ' every pinned stage fits the viewport' + (over.length ? ' -- ' + over.join('; ') : ''));
  await p.close();
}
// And the closing sentence must actually read in full at some scroll point.
const p2 = await b.newPage({ viewport: { width: 390, height: 844 } });
await p2.goto(base, { waitUntil: 'networkidle' });
if (process.env.BREAK === 'stage') await p2.addStyleTag({ content: '.close{height:1400px !important}' });
const sec = await p2.evaluate(() => { const s = document.getElementById('ch6'); return s ? s.offsetTop : 0; });
let full = false, txt = '';
for (let k = 0; k <= 14 && !full; k++) {
  await p2.evaluate(v => scrollTo(0, v), sec + k * 90);
  await p2.waitForTimeout(40);
  const r = await p2.evaluate(() => {
    const h = document.getElementById('h-close');
    if (!h) return { v: false, t: '' };
    const u = h.querySelectorAll('.sc-line');
    const L = u.length ? [...u] : [h];
    const vis = L.every(e => { const q = e.getBoundingClientRect(); return q.top >= -1 && q.bottom <= innerHeight + 1 && +getComputedStyle(e).opacity > 0.9; });
    return { v: vis, t: L.map(e => e.textContent.trim()).join(' ') };
  });
  full = r.v; txt = r.t;
}
ok(full, 'closing heading fully readable: ' + JSON.stringify(txt));
ok(/^Three things, and none of them require a lawyer\.$/.test(txt.replace(/\s+/g, ' ').trim()), 'closing sentence is complete and sensible');
await p2.close();
console.log(fails ? 'RESULT FAIL (' + n + ' assertions, ' + fails + ' failures)' : 'RESULT PASS (' + n + ' assertions, 0 failures)');
await b.close();
process.exit(fails ? 1 : 0);
