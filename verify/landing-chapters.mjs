// Landing page: chapter cards + outreach band.
// BREAK=cards -> strip the chapter cards; BREAK=reach -> strip the outreach band.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE);
const base = process.argv[2] || 'http://localhost:4700/';
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('ok   ' + m); } else { fail++; console.log('FAIL ' + m); } }
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base, { waitUntil: 'networkidle' });
if (BREAK === 'cards') await p.evaluate(() => document.querySelectorAll('.ch-card').forEach(e => e.remove()));
if (BREAK === 'reach') await p.evaluate(() => document.querySelectorAll('.reach-item').forEach(e => e.remove()));
const r = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.ch-card')];
  return {
    n: cards.length,
    hrefs: cards.map(c => c.getAttribute('href')),
    imgs: cards.map(c => { const i = c.querySelector('img'); return i ? { w: i.naturalWidth, alt: (i.getAttribute('alt')||'').length, lazy: i.getAttribute('loading') } : null; }),
    reach: [...document.querySelectorAll('.reach-item')].map(a => a.getAttribute('href')),
    badges: cards.map(c => (c.querySelector('.ch-card-badge')||{}).textContent)
  };
});
ok(r.n === 3, 'three chapter cards present (' + r.n + ')');
ok(r.hrefs.every(h => h && h.startsWith('/dossier/')), 'every card links into the dossier');
ok(new Set(r.hrefs).size === r.hrefs.length, 'each card targets a distinct anchor');
ok(r.imgs.every(i => i && i.w > 0), 'every card image actually loaded (no broken art)');
ok(r.imgs.every(i => i && i.alt > 15), 'every card image carries real alt text');
ok(r.imgs.every(i => i && i.lazy === 'lazy'), 'card images are lazy-loaded');
ok(r.reach.length === 3, 'three outreach routes present (' + r.reach.length + ')');
// A doorway that leads nowhere is worse than no doorway: follow each link.
let dead = 0;
for (const h of r.hrefs) {
  const url = new URL(h, base).href;
  const frag = url.split('#')[1];
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  const found = frag ? await p.evaluate(f => !!document.getElementById(f), frag) : true;
  if (!found) { dead++; console.log('     dead anchor: ' + h); }
}
ok(dead === 0, 'every chapter link resolves to a real section (' + dead + ' dead)');
await b.close();
console.log('RESULT ' + (fail ? 'FAIL' : 'PASS') + ' (' + pass + ' assertions, ' + fail + ' failures)');
process.exit(fail ? 1 : 0);
