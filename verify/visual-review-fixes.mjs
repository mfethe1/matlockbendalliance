/* Verification for the visual-review fixes:

     dossier/index.html  -- mobile pan handler no longer wipes the desktop rail
                         -- map legend cue given an exit so it stops covering
                            later chapters
                         -- source ledger retires at the closing section
     index.html          -- alerts lead, footer link, citations, tag chips,
                            skip link and dossier CTA raised to AA contrast

   This is NOT a project test suite; the repo is a static site with no test
   runner, so this script asserts the changed behaviour directly in Chrome.

   Usage: node <this> [baseUrl]
   Env BREAK=rail|ledger|contrast injects a fault to prove each assertion can
   actually fail (a check that cannot fail proves nothing).

   BREAK=legend is deliberately NOT simulated: every injection attempt was
   out-raced by the engine's own per-frame write, and a fault that does not
   bite would be a fake proof. That check is instead proven by replay: extract
   commit de5476b (cue "0.02", no exit) to a temp dir, serve it, and run this
   suite against it -- it fails with "legend fades out past its own act
   (opacity 1)" while the current tree reports 0.

   That replay is also why the scroll offset below is 1.5 viewports, not 0.8.
   Adding an act after the map moved the old landing INSIDE the next act, where
   an un-exited legend is still off screen: the check went green on the known
   buggy tree. An offset is only load-bearing if the replay still fails.

   Contrast note: a naive "first non-transparent ancestor" walk reports
   translucent chips as 1:1, because it stops at the element's own rgba() fill
   and never blends it with the card beneath. Every background here is
   composited down the ancestor chain before the ratio is taken.
*/
// Resolved at runtime so the checkout does not carry an author's local path.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const BASE = (process.argv[2] || 'https://tnwaste.org/').replace(/\/$/, '') + '/';
const BREAK = process.env.BREAK || '';
const fails = [], notes = [];
const ok = (cond, msg) => { notes.push((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails.push(msg); };

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
});

/* ---------- 1. desktop rail: every plate must be reachable ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + 'dossier/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  if (BREAK === 'rail') {
    // Restore the bug: the mobile handler clearing the transform on desktop.
    await page.evaluate(() => {
      const rail = document.querySelector('.rail');
      /* A scroll listener is not enough: the engine writes the transform in its
         own rAF callback, which runs after the listener, so the engine simply
         wins and the check passes. The real bug clobbered the value on every
         frame -- reproduce that with a rAF loop. */
      (function wipe() { rail.style.transform = ''; requestAnimationFrame(wipe); })();
    });
  }

  const range = await page.evaluate(() => {
    const sec = document.querySelector('section[data-sc-act="pan"]');
    return { top: sec.getBoundingClientRect().top + scrollY, h: sec.offsetHeight,
             need: Math.round(document.querySelector('.rail').scrollWidth - innerWidth) };
  });

  // Driven from Node with real waits: the engine eases the transform, so an
  // in-page rAF loop scrolls faster than the rail can converge and reports 0.
  const best = {};
  let maxShift = 0;
  for (let y = range.top - 200; y <= range.top + range.h + 200; y += 80) {
    await page.evaluate(_y => window.scrollTo(0, _y), y);
    await page.waitForTimeout(260);
    const s = await page.evaluate(() => {
      const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.rail')).transform);
      const out = [];
      document.querySelectorAll('.rail .plate').forEach(el => {
        const r = el.getBoundingClientRect();
        const iw = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
        const ih = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        out.push(r.width * r.height ? (iw * ih) / (r.width * r.height) : 0);
      });
      return { shift: Math.abs(m.m41), fr: out };
    });
    maxShift = Math.max(maxShift, s.shift);
    s.fr.forEach((f, i) => { best[i] = Math.max(best[i] || 0, f); });
  }

  ok(maxShift > range.need * 0.9,
     `rail pans on desktop (shift ${Math.round(maxShift)}px, needs ~${range.need}px)`);
  Object.keys(best).sort((a, b) => a - b).forEach(k =>
    ok(best[k] > 0.95, `plate #${k} becomes fully visible (best ${(best[k] * 100).toFixed(1)}%)`));
  await page.close();
}

/* ---------- 2. fixed legend must leave with its own act ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const legendBreak = BREAK === 'legend';

  if (BREAK === 'legend') {
    /* No synthetic fault here, deliberately. Every injection tried (cue
       rewrite, inline opacity, --sc-cue override) was out-raced by the engine's
       own per-frame write, which would have produced a fake "proof".

       This assertion does not need a simulated fault: the real un-fixed site
       fails it. Point the suite at production to see it fail for real:

         node verify/visual-review-fixes.mjs https://tnwaste.org/
         -> FAIL legend fades out past its own act (opacity 1)

       That is the negative control for this check. */
    notes.push('  note  BREAK=legend: see comment -- proven against production, not simulated');
  }

  // Navigate after any init script is registered, so the fault is in place.
  await page.goto(BASE + 'dossier/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  void legendBreak;

  const res = await page.evaluate(async () => {
    const legend = document.querySelector('.legend');
    // Land past the legend's own act but still inside the document. The offset
    // matters: at 0.8 the landing now falls inside the act that follows, where
    // a legend left un-exited is still off screen and the bug reads clean.
    const act = legend.closest('[data-sc-act]');
    const end = act.offsetTop + act.offsetHeight;
    scrollTo(0, Math.min(end + innerHeight * 1.5,
                         document.body.scrollHeight - innerHeight * 1.5));
    // Poll until the opacity stops changing rather than guessing a delay: the
    // value is driven by a CSS transition, and a fixed wait samples it
    // mid-fade under network jitter (observed 0.346 on a settled-clean page).
    let prev = -1, cur = +getComputedStyle(legend).opacity, stable = 0;
    for (let i = 0; i < 60 && stable < 3; i++) {
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));
      prev = cur; cur = +getComputedStyle(legend).opacity;
      stable = Math.abs(cur - prev) < 0.001 ? stable + 1 : 0;
    }
    return { opacity: cur, settled: stable >= 3 };
  });

  ok(res.settled, `legend opacity settled before sampling (settled=${res.settled})`);
  ok(res.opacity < 0.1,
     `legend fades out past its own act (opacity ${res.opacity})`);
  await page.close();
}

/* ---------- 3. source ledger must not trap text at the document end ---------- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE + 'dossier/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  if (BREAK === 'ledger') {
    await page.evaluate(() => {
      const l = document.querySelector('.ledger');
      l.setAttribute('data-retired', '0');
      l.style.setProperty('visibility', 'visible', 'important');
      l.style.setProperty('transform', 'translateY(calc(100% - 2.2rem))', 'important');
    });
  }

  const res = await page.evaluate(async () => {
    // Scroll in steps and re-read the height: the dossier's pinned acts change
    // document height as they resolve, so a single jump lands short of the end.
    for (let i = 0; i < 6; i++) {
      scrollTo(0, document.documentElement.scrollHeight);
      await new Promise(r => setTimeout(r, 300));
    }
    await new Promise(r => setTimeout(r, 600));
    const el = document.querySelector('.ledger');
    const cs = getComputedStyle(el);
    // A retired/hidden bar covers nothing; counting it is a false positive.
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return { stuck: [] };
    const bar = el.getBoundingClientRect();
    if (bar.top >= innerHeight) return { stuck: [] };
    const stuck = [];
    document.querySelectorAll('p, li, figcaption, h2, h3, a').forEach(n => {
      if (el.contains(n)) return; // the bar's own caption is not trapped content
      const r = n.getBoundingClientRect();
      if (!r.width || !n.textContent.trim()) return;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const ov = Math.min(r.bottom, bar.bottom) - Math.max(r.top, bar.top);
      if (ov > 4) stuck.push(n.textContent.trim().slice(0, 40));
    });
    return { stuck };
  });

  ok(res.stuck.length === 0,
     `no text trapped under the ledger at the last scroll position` +
     (res.stuck.length ? ` (${res.stuck[0]}...)` : ''));
  await page.close();
}

/* ---------- 4. landing page text must meet WCAG AA ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  if (BREAK === 'contrast') {
    await page.evaluate(() => {
      document.querySelectorAll('.citation').forEach(c => { c.style.color = '#64748b'; });
    });
  }

  const res = await page.evaluate(() => {
    const parse = s => {
      const m = /rgba?\(([^)]+)\)/.exec(s);
      if (!m) return null;
      const v = m[1].split(',').map(x => parseFloat(x.trim()));
      return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 };
    };
    const chan = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
    const ratio = (a, b) => {
      const la = lum(a), lb = lum(b), hi = Math.max(la, lb), lo = Math.min(la, lb);
      return (hi + 0.05) / (lo + 0.05);
    };
    // Composite every translucent fill down to an opaque colour. A "first
    // non-transparent ancestor" walk reports chips as 1:1, because it stops at
    // the element's own rgba() fill and never blends it with the card beneath.
    const bgOf = el => {
      const stack = [];
      let n = el;
      while (n && n !== document.documentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
        n = n.parentElement;
      }
      let out = [255, 255, 255];
      const base = stack[stack.length - 1];
      if (base && base.a === 1) out = [base.r, base.g, base.b];
      for (let i = stack.length - 1; i >= 0; i--) {
        const c = stack[i];
        out = [c.r, c.g, c.b].map((v, k) => Math.round(v * c.a + out[k] * (1 - c.a)));
      }
      return out;
    };
    const measure = el => {
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      const bg = bgOf(el);
      const a = fg.a * (+cs.opacity || 1);
      const eff = [fg.r, fg.g, fg.b].map((v, k) => Math.round(v * a + bg[k] * (1 - a)));
      return +ratio(eff, bg).toFixed(2);
    };

    /* Only the elements this change touched are graded. A whole-page sweep
       cannot read background-image gradients, so it invents failures for any
       element sitting on one -- the same false-positive trap that produced
       bogus 1:1 readings during the review. */
    const targets = {
      'alerts lead':   '.newsletter-lead',
      'citation':      '.citation',
      'tag (danger)':  '.tag-danger',
      'tag (info)':    '.tag-info',
      'footer link':   '.footer a',
      'footer note':   '.footer-inner p[style*="opacity"]',
      'dossier CTA':   '.dossier-band-cta'
    };
    const out = [];
    for (const [name, sel] of Object.entries(targets)) {
      const el = document.querySelector(sel);
      if (!el) { out.push({ name, missing: true }); continue; }
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize), weight = +cs.fontWeight || 400;
      const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
      out.push({ name, got: measure(el), need });
    }
    // The skip link is off-screen until focused; grade it focused, as used.
    const skip = document.querySelector('.skip-link');
    if (skip) { skip.focus(); out.push({ name: 'skip link (focused)', got: measure(skip), need: 4.5 }); }
    return out;
  });

  res.forEach(r => {
    if (r.missing) { ok(false, `${r.name}: element not found`); return; }
    ok(r.got >= r.need, `${r.name} meets AA (${r.got}:1, needs ${r.need}:1)`);
  });
  await page.close();
}

await browser.close();

console.log(notes.join('\n'));
if (BREAK) {
  console.log(`\nBREAK=${BREAK}: ${fails.length ? 'faults detected as expected' : 'NO FAILURE -- the check is not load-bearing'}`);
  process.exit(fails.length ? 0 : 1);
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
