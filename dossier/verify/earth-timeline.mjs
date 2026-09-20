/* Acceptance check for the "change over time" timeline in the Approach act.
 *
 * The defect this guards against is specific and was really shipped: the act
 * carried a frame labelled 2026 that was a byte-near copy of the 2023 frame
 * (mean abs pixel difference 2.68/255), plus a 2017 frame with no capture
 * behind it. A caption that names a date the pixels do not come from is the
 * one failure this page cannot survive, so the assertions below check
 * provenance, not just that images appear.
 *
 * Checks, in order:
 *   1. every timeline frame resolves (naturalWidth > 0) -- no broken assets
 *   2. every frame has a matching entry in assets/earth/provenance.json, and
 *      the visible caption's date agrees with the recorded capture_date
 *   3. no two frames are near-duplicates (downsampled mean abs diff >= 8/255)
 *   4. scrolling the act shows the frames in chronological order, each one
 *      paired with its own caption (image year === caption year)
 *
 * Usage: node <this> [baseUrl] [width] [height]
 * Env BREAK=dupe|mislabel|order injects a fault to prove each assertion can
 * actually fail. An assertion that cannot fail proves nothing.
 */
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const BASE = process.argv[2] || 'https://tnwaste.org/dossier/';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900);
const BREAK = process.env.BREAK || '';
const fails = [], notes = [];
const ok = (cond, msg) => { notes.push((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails.push(msg); };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

// Serve a duplicated frame to reproduce the shipped defect: 2023's bytes
// returned for the 2021 request. Registered before goto or the real asset is
// already in flight.
if (BREAK === 'dupe') await page.route('**/tl-2021.webp*', async (route) => {
  const res = await route.fetch({ url: new URL('assets/earth/tl-2023.webp', BASE).href });
  await route.fulfill({ response: res });
});

// BREAK=faint strips the fade window off the LAST timeline frame (whichever
// year that is) so the peak-opacity assertion has a control that really bites.
if (BREAK === 'faint') await page.route((u) => /\/dossier\/(index\.html)?(\?|$)/.test(u.pathname + u.search), async (route) => {
  const res = await route.fetch();
  let html = await res.text();
  const all = [...html.matchAll(/data-sc-cue="([^"]*)"(?=[^>]*?(tl-\d{4}(?:-\d{2})?\.webp))/g)];
  if (all.length) {
    const last = all[all.length - 1];
    html = html.replace(last[0], 'data-sc-cue="0.999"');
  }
  await route.fulfill({ response: res, body: html });
});

// The engine parses data-sc-cue at load, so mutating the attribute afterwards
// is a no-op control that proves nothing. Swap the two frames' cues in the
// HTML before the parser sees them, which is the real out-of-order defect.
if (BREAK === 'order') await page.route((u) => /\/dossier\/(index\.html)?(\?|$)/.test(u.pathname + u.search), async (route) => {
  const res = await route.fetch();
  let html = await res.text();
  const cueOf = (f) => (html.match(new RegExp('data-sc-cue="([^"]*)"(?=[^>]*' + f + ')')) || [])[1];
  const a = cueOf('tl-2012\\.webp'), b = cueOf('tl-2023\\.webp');
  if (a && b) {
    html = html.replace(new RegExp('data-sc-cue="' + a + '"(?=[^>]*tl-2012\\.webp)'), 'data-sc-cue="' + b + '"')
               .replace(new RegExp('data-sc-cue="' + b + '"(?=[^>]*tl-2023\\.webp)'), 'data-sc-cue="' + a + '"');
  }
  await route.fulfill({ response: res, body: html });
});

await page.goto(BASE + (BASE.includes('?') ? '&' : '?') + 'cb=' + Date.now(), { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

if (BREAK === 'mislabel') await page.evaluate(() => {
  document.querySelectorAll('.earth__yr')[3].firstChild.nodeValue = 'May 2015';
});

const prov = await page.evaluate(async (base) => {
  const r = await fetch(new URL('assets/earth/provenance.json', base).href);
  return r.ok ? r.json() : null;
}, BASE);
ok(!!prov, 'assets/earth/provenance.json is fetchable');
ok(prov && prov.frames && prov.frames.length >= 6,
   `provenance records >= 6 frames (got ${prov && prov.frames ? prov.frames.length : 0})`);

// ---- 1. assets resolve -----------------------------------------------------
const frames = await page.evaluate(() =>
  [...document.querySelectorAll('.earth__l')]
    .filter((i) => /tl-\d{4}(-\d{2})?\./.test(i.getAttribute('src')))
    .map((i) => ({
      file: i.getAttribute('src').split('/').pop(),
      w: i.naturalWidth, h: i.naturalHeight, cue: i.dataset.scCue || '',
    })));
ok(frames.length >= 6, `timeline has >= 6 frames (got ${frames.length})`);
for (const f of frames) ok(f.w > 0 && f.h > 0, `${f.file} decoded (${f.w}x${f.h})`);

// ---- 2. captions agree with recorded capture dates -------------------------
const caps = await page.evaluate(() =>
  [...document.querySelectorAll('.earth__yr')].map((s) => ({
    date: (s.firstChild.nodeValue || '').trim(),
    sub: (s.querySelector('i')?.textContent || '').trim(),
  })));
ok(caps.length === frames.length,
   `one caption per frame (${caps.length} captions, ${frames.length} frames)`);

const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
for (let i = 0; i < Math.min(caps.length, frames.length); i++) {
  const rec = prov.frames.find((p) => p.asset.endsWith(frames[i].file));
  if (!ok(!!rec, `${frames[i].file} has a provenance entry`)) continue;
  const [mon, yr] = caps[i].date.split(/\s+/);
  const [py, pm] = rec.capture_date.split('-').map(Number);
  ok(+yr === py && MON[mon] === pm,
     `${frames[i].file} caption "${caps[i].date}" matches capture ${rec.capture_date}`);
  ok(caps[i].sub.length > 0 && /m$/.test(caps[i].sub),
     `${frames[i].file} caption names a source and resolution ("${caps[i].sub}")`);
}

// ---- 3. no two frames are near-duplicates ----------------------------------
const diffs = await page.evaluate(async () => {
  const srcs = [...document.querySelectorAll('.earth__l')]
    .map((i) => i.getAttribute('src'))
    .filter((s) => /tl-\d{4}(-\d{2})?\./.test(s));
  const N = 64, data = [];
  for (const s of srcs) {
    const im = new Image(); im.src = s; await im.decode();
    const c = document.createElement('canvas'); c.width = c.height = N;
    c.getContext('2d').drawImage(im, 0, 0, N, N);
    data.push({ file: s.split('/').pop(), px: c.getContext('2d').getImageData(0, 0, N, N).data });
  }
  const out = [];
  for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) {
    let sum = 0, n = 0;
    for (let k = 0; k < data[a].px.length; k += 4) {
      sum += Math.abs(data[a].px[k] - data[b].px[k])
           + Math.abs(data[a].px[k + 1] - data[b].px[k + 1])
           + Math.abs(data[a].px[k + 2] - data[b].px[k + 2]);
      n += 3;
    }
    out.push({ a: data[a].file, b: data[b].file, d: sum / n });
  }
  return out;
});
const worst = diffs.reduce((m, x) => (x.d < m.d ? x : m), { d: Infinity });
ok(worst.d >= 8,
   `no duplicate frames: closest pair ${worst.a} vs ${worst.b} differs ${worst.d.toFixed(2)}/255 (need >= 8)`);

// ---- 4. frames advance chronologically as the act scrolls ------------------
const geom = await page.evaluate(() => {
  const sec = document.querySelector('.earth').closest('section');
  return { top: sec.offsetTop, height: sec.offsetHeight };
});
const seen = [];
const peakOpacity = new Map();
for (let p = 0.36; p <= 1.001; p += 0.02) {
  await page.evaluate(([t, h, pr, vh]) => scrollTo(0, t + (h - vh) * pr), [geom.top, geom.height, p, H]);
  await page.waitForTimeout(260);
  const shot = await page.evaluate(() => {
    const top = (list) => list
      .map((e) => ({ k: e.k, o: +getComputedStyle(e.el).opacity }))
      .sort((x, y) => y.o - x.o)[0];
    const img = top([...document.querySelectorAll('.earth__l')]
      .map((el) => ({ el, k: el.getAttribute('src').split('/').pop() }))
      .filter((e) => /tl-\d{4}(-\d{2})?\./.test(e.k)));
    const cap = top([...document.querySelectorAll('.earth__yr')]
      .map((el) => ({ el, k: (el.firstChild.nodeValue || '').trim() })));
    return { img, cap };
  });
  if (!shot.img || shot.img.o < 0.5) continue;
  peakOpacity.set(shot.img.k, Math.max(peakOpacity.get(shot.img.k) || 0, shot.img.o));
  // Two frames can share a year (e.g. Apr and Oct 2018), so compare the full
  // year-month from provenance, not just the year: a swap between two frames of
  // the same year would otherwise pass unnoticed.
  const recNow = prov.frames.find((f) => f.asset.endsWith(shot.img.k));
  const key = recNow ? recNow.capture_date.slice(0, 7) : shot.img.k.match(/(\d{4})/)[1];
  const yr = +key.slice(0, 4);
  let capKey = null;
  if (shot.cap && shot.cap.o > 0.4) {
    const m = shot.cap.k.match(/([A-Z][a-z]{2})?\s*(\d{4})/);
    if (m) capKey = m[1] ? `${m[2]}-${String(MON[m[1]]).padStart(2, '0')}` : m[2];
  }
  if (capKey) {
    const same = capKey.length === 4 ? capKey === key.slice(0, 4) : capKey === key;
    ok(same, `at p=${p.toFixed(2)} frame ${key} is captioned ${capKey}`);
  }
  if (seen[seen.length - 1] !== yr) seen.push(yr);
}
const sorted = [...seen].sort((a, b) => a - b);
ok(seen.length >= 5, `scroll surfaced >= 5 distinct frames (got ${seen.length}: ${seen.join(',')})`);
ok(JSON.stringify(seen) === JSON.stringify(sorted),
   `frames appear oldest-to-newest (saw ${seen.join(',')})`);

// ---- 5. every frame actually surfaces AND reaches near-full opacity --------
// A frame that only ever half-fades leaves the previous act bleeding through;
// one that never surfaces at all is worse. Both shipped as real bugs.
const surfacedFiles = new Set(peakOpacity.keys());
const missing = frames.map((f) => f.file).filter((f) => !surfacedFiles.has(f));
ok(missing.length === 0,
   `every frame in the DOM surfaces during scroll (missing: ${missing.join(', ') || 'none'})`);
const faint = [...peakOpacity.entries()].filter(([, o]) => o < 0.95);
ok(faint.length === 0,
   `every surfaced frame reaches opacity >= 0.95 (faint: ${faint.map(([k, o]) => `${k}@${o.toFixed(2)}`).join(', ') || 'none'})`);

await browser.close();
console.log(notes.join('\n'));
console.log(fails.length ? `RESULT FAIL (${fails.length})` : 'RESULT PASS');
process.exit(fails.length ? 1 : 0);
