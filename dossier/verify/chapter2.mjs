/* Ad-hoc verification for this turn's changes to the TN Waste dossier:
     dossier/index.html      -- shaped readplate, early legend cue, slug chip
     dossier/scrollcraft.js  -- lone data-sc-count must count UP, not down to 0

   This is NOT a project test suite; the repo is a static site with no test
   runner, so this script asserts the changed behaviour directly in Chrome.

   Usage: node <this> [baseUrl] [width] [height]
   Env BREAK=plate|legend|count injects a fault to prove each assertion can
   actually fail (a check that cannot fail proves nothing).

   Contrast note: shoot.mjs grades an element's whole bounding box against the
   brightest pixel in it, which over a busy map flags gaps BETWEEN glyphs. Here
   we hide the text, screenshot the backdrop, then measure only inside the line
   boxes the glyphs occupy -- and if an element paints its own opaque fill (the
   slug chip, the legend panel), that fill is the backdrop.
*/
// Resolved at runtime so the checkout does not carry an author's local path.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const BASE = process.argv[2] || 'https://tnwaste.org/dossier/';
const W = +(process.argv[3] || 390), H = +(process.argv[4] || 844);
const BREAK = process.env.BREAK || '';
const fails = [], notes = [];
const ok = (cond, msg) => { notes.push((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails.push(msg); };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
// Reproduce the real bug honestly: serve the PRE-FIX engine. Mutating the
// attribute after load is useless (the engine has already parsed it), and
// pinning textContent is overwritten on the next tick. Stripping the two
// "lone value means count up" guards restores the exact shipped defect,
// so this control proves the assertion catches a real 0 render.
// Must be registered BEFORE goto, or the real engine is already fetched.
if (BREAK === 'count') await page.route('**/scrollcraft.js*', async (route) => {
  const res = await route.fetch();
  let js = await res.text();
  js = js.replace(/\s*if \(nums\.length === 1\) nums = \['0', nums\[0\]\];/g, '')
         .replace(/\s*if \(n\.length === 1\) \{ c\.textContent = formatNum\(0, n\[0\]\); return; \}/g, '');
  await route.fulfill({ response: res, body: js });
});
await page.goto(BASE + (BASE.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

if (BREAK === 'plate') await page.addStyleTag({ content: '.readplate{background:rgba(10,9,8,.95)!important}' });
if (BREAK === 'legend') await page.addStyleTag({ content: '.legend{opacity:0!important}' });
// Restores the pre-fix anchoring so the overlap guard is provably falsifiable.
if (BREAK === 'abs') await page.addStyleTag({ content: '.legend{position:absolute!important}' });

const geom = await page.evaluate(() => {
  const l = document.querySelector('.legend');
  const sec = l.closest('section');
  return { top: sec.offsetTop, height: sec.offsetHeight };
});
const at = async (prog) => {
  await page.evaluate(([t, h, p, vh]) => scrollTo(0, t + (h - vh) * p), [geom.top, geom.height, prog, H]);
  await page.waitForTimeout(450);
};

// 1. the plate must not blanket the map any more (it measured .90 flat)
await at(0.35);
const plate = await page.evaluate(() => {
  const el = document.querySelector('.readplate');
  const bg = getComputedStyle(el).backgroundImage;
  const stops = [...bg.matchAll(/rgba?\([^)]*?([\d.]+)\s*\)/g)].map(m => +m[1]);
  return { max: stops.length ? Math.max(...stops) : 1, mapFilter: getComputedStyle(document.querySelector('.mapstage img')).filter };
});
ok(plate.max <= 0.85, `readplate peak opacity ${plate.max} <= 0.85 (was .90 flat, hiding the map)`);
ok(/brightness\((1(\.\d+)?|[1-9])/.test(plate.mapFilter), `map raster not darkened: ${plate.mapFilter}`);

// 2. the legend must exist when the copy says "look at the map"
await at(0.12);
const legendEarly = await page.evaluate(() => +getComputedStyle(document.querySelector('.legend')).opacity);
ok(legendEarly > 0.3, `legend visible early (opacity ${legendEarly.toFixed(2)} at 12% of the chapter)`);
await at(0.45);
const legendFull = await page.evaluate(() => {
  const l = document.querySelector('.legend');
  return { op: +getComputedStyle(l).opacity, rows: l.querySelectorAll('.legend__row').length };
});
ok(legendFull.op > 0.95, `legend fully opaque mid-chapter (${legendFull.op})`);
ok(legendFull.rows === 4, `legend names 4 map features (found ${legendFull.rows})`);

// The legend sits inside the narrow copy column, so a position change can drop
// it straight onto the prose. Guard the collision directly, not just contrast.
// Sweep the same positions the contrast pass uses: the copy fades in and out,
// so a single sample can miss the frame where the panel lands on live text.
let overlap = 0;
for (const prog of [0.25, 0.35, 0.45, 0.55, 0.7]) {
  await at(prog);
  overlap = Math.max(overlap, await page.evaluate(() => {
  const l = document.querySelector('.legend').getBoundingClientRect();
  let worst = 0;
  document.querySelectorAll('.hero__copy .sc-lede').forEach(el => {
    if (+getComputedStyle(el).opacity < 0.5) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, l.right) - Math.max(r.left, l.left));
    const h = Math.max(0, Math.min(r.bottom, l.bottom) - Math.max(r.top, l.top));
    worst = Math.max(worst, w * h);
  });
  return Math.round(worst);
  }));
}
ok(overlap === 0, `legend does not cover the prose (${overlap}px2 overlap)`);

// 3. every scrap of type over the map must clear 3:1 under its own glyphs
const contrast = [];
for (const prog of [0, 0.25, 0.35, 0.45, 0.7]) {
  await at(prog);
  const sel = '.hero__copy .slug, .hero__copy .sc-lede, .hero__copy .sc-body, .hero__copy .sc-display, .hero__copy .hero__kicker, .legend__t, .legend__n';
  const items = await page.evaluate((s) => {
    const parse = (str) => (str.match(/[\d.]+/g) || []).map(Number);
    return [...document.querySelectorAll(s)].filter(el => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      // Opacity is inherited from animating ancestors (scroll cues), so an
      // element with opacity:1 can still be fully invisible. Grading text
      // nobody can see reports a meaningless 1:1, so walk the chain.
      let o = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        o *= +getComputedStyle(n).opacity;
        if (getComputedStyle(n).visibility === 'hidden') return false;
      }
      return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && o > 0.5;
    }).map(el => {
      const cs = getComputedStyle(el);
      const rng = document.createRange(); rng.selectNodeContents(el);
      const lines = [...rng.getClientRects()].filter(r => r.width > 2 && r.height > 2);
      // an element that paints its own opaque fill IS its backdrop
      let own = null;
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.length >= 3 && (c.length < 4 || c[3] > 0.5)) { own = c.slice(0, 3); break; }
      }
      return { txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34), fg: parse(cs.color).slice(0, 3), own, lines: lines.map(r => ({ x: r.x, y: r.y, w: r.width, h: r.height })) };
    });
  }, sel);
  if (!items.length) continue;
  await page.evaluate((s) => document.querySelectorAll(s).forEach(e => { e.dataset.hid = e.style.color; e.style.color = 'transparent'; }), sel);
  const shot = (await page.screenshot()).toString('base64');
  await page.evaluate((s) => document.querySelectorAll(s).forEach(e => { e.style.color = e.dataset.hid || ''; }), sel);
  const graded = await page.evaluate(async ({ shot, items, dpr }) => {
    const lum = (c) => { const f = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * f[0] + .7152 * f[1] + .0722 * f[2]; };
    const img = new Image(); img.src = 'data:image/png;base64,' + shot; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    return items.map(it => {
      const L1 = lum(it.fg);
      let worst = 21;
      if (it.own) {
        const L2 = lum(it.own);
        worst = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      } else {
        for (const r of it.lines) {
          const d = cx.getImageData(Math.round(r.x * dpr), Math.round(r.y * dpr), Math.max(1, Math.round(r.w * dpr)), Math.max(1, Math.round(r.h * dpr))).data;
          for (let i = 0; i < d.length; i += 4) {
            const L2 = lum([d[i], d[i + 1], d[i + 2]]);
            const c = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
            if (c < worst) worst = c;
          }
        }
      }
      return { txt: it.txt, ratio: +worst.toFixed(2) };
    });
  }, { shot, items, dpr: 2 });
  graded.forEach(g => contrast.push({ ...g, prog }));
}
const worstByText = new Map();
contrast.forEach(c => { const p = worstByText.get(c.txt); if (!p || c.ratio < p.ratio) worstByText.set(c.txt, c); });
const bad = [...worstByText.values()].filter(c => c.ratio < 3);
ok(bad.length === 0, `all type over the map clears 3:1 (worst offenders: ${bad.map(b => `${b.ratio}:1 "${b.txt}"`).join('; ') || 'none'})`);
const worstAll = Math.min(...[...worstByText.values()].map(c => c.ratio));

// 4. counters must publish the real figure, never 0
const counters = await page.evaluate(async () => {
  const h = document.documentElement.scrollHeight;
  for (let y = 0; y <= h; y += Math.round(innerHeight * 0.5)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); }
  await new Promise(r => setTimeout(r, 1200));
  return [...document.querySelectorAll('[data-sc-count]')].map(e => ({ want: e.getAttribute('data-sc-count').trim(), got: (e.textContent || '').trim() }));
});
ok(counters.length > 0, `found ${counters.length} counters`);
counters.forEach(c => ok(c.got === c.want && c.got !== '0', `counter renders ${c.want} (got "${c.got}")`));

await browser.close();
console.log(`\n${BASE}  ${W}x${H}${BREAK ? '  BREAK=' + BREAK : ''}`);
console.log(notes.join('\n'));
console.log(`\nworst glyph-backdrop contrast: ${worstAll}:1`);
console.log(fails.length ? `RESULT FAIL (${fails.length})` : `RESULT PASS (${notes.length} assertions, 0 failures)`);
process.exit(fails.length ? 1 : 0);
