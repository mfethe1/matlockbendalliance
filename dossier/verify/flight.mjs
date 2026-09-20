/* Chapter 1.5 -- the orbital approach and the twelve-year satellite record.

   Four failure modes, all of which actually happened while building it:
     - a frame never reaching full opacity (cue window shorter than its ramp)
     - the stage thinning to the drift colour mid-crossfade (linear fades sum
       to 75% coverage at the seam, so a held base layer sits under the stack)
     - the act unpinning while the timeline still has frames to show
     - the source credit fading out, which the imagery licence does not allow

   Coverage is measured as stacked opacity, not "is anything visible": two
   layers at 0.5 are not a blank stage, and treating them as one cried wolf.

   BREAK=base | credit inject the two regressions that are reproducible.
*/
const { chromium } = await import(process.env.PLAYWRIGHT_CORE);
const base = process.argv[2] || 'http://localhost:4700/dossier/';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base, { waitUntil: 'networkidle' });

const BREAK = process.env.BREAK || '';
if (BREAK === 'base') {
  // Regression: no held base layer, so the drift colour shows through the seam.
  await p.evaluate(() => document.querySelector('.earth__base')?.remove());
}
if (BREAK === 'credit') {
  // Regression: attribution fades with the act. The imagery licence requires it.
  await p.evaluate(() => {
    const c = document.querySelector('.earth__credit');
    if (c) c.style.opacity = '0';
  });
}
if (BREAK === 'orphan') {
  // Regression: the real bug. The cue sat on the <p> instead of the .claim
  // wrapper, so the text faded on schedule while its "Show source" button and
  // source panel stayed lit across the whole act, stranded beside other frames.
  await p.evaluate(() => {
    document.querySelectorAll('.earth .claim[data-sc-cue]').forEach(c => {
      const cue = c.getAttribute('data-sc-cue');
      c.removeAttribute('data-sc-cue');
      c.querySelector('.claim__text').setAttribute('data-sc-cue', cue);
    });
  });
}

if (BREAK === 'clock') {
  // Regression: the real bug. Year cues shifted out of step with the frames,
  // so the readout dated the wrong photograph.
  await p.evaluate(() => {
    document.querySelectorAll('.earth__yr').forEach(e => {
      const c = e.getAttribute('data-sc-cue').split(/\s+/).map(Number);
      c[0] -= 0.06; if (c.length > 1) c[1] -= 0.06;
      e.setAttribute('data-sc-cue', c.join(' '));
    });
    ScrollCraft.mount();
  });
}
const box = await (await p.$('section#h-approach')).boundingBox();
const travel = box.height - 900;
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok   ' : 'FAIL ') + m); };

const peak = {}; let blank = 0, unpinned = 0, creditDim = 0, mislabelled = 0, orphaned = 0; let claimCount = -1;
for (let i = 0; i <= 60; i++) {
  await p.evaluate(y => scrollTo(0, y), box.y + travel * (i / 60));
  await p.waitForTimeout(70);
  const r = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('.earth__l, .earth__base')]
      .map(i => [i.src.split('/').pop(), +getComputedStyle(i).opacity]);
    const st = document.querySelector('section#h-approach [data-sc-stage]').getBoundingClientRect();
    // The strongest timeline frame and the strongest year readout must name the
    // same date. A cue edited on one but not the other dates the wrong photo.
    const yr = [...document.querySelectorAll('.earth__yr')]
      .map(e => [e.textContent.trim(), +getComputedStyle(e).opacity])
      .sort((a, b) => b[1] - a[1])[0];
    return { vis, yr, top: Math.round(st.top), credit: +getComputedStyle(document.querySelector('.earth__credit')).opacity,
             // A claim's control must not outlive the sentence it belongs to:
             // cueing the <p> instead of the wrapper strands the button on screen.
             claims: document.querySelectorAll('section#h-approach .claim').length,
             orphan: [...document.querySelectorAll('section#h-approach .claim')].some(c =>
               +getComputedStyle(c.querySelector('.claim__text')).opacity < 0.05 &&
               +getComputedStyle(c.querySelector('.claim__btn')).opacity > 0.5) };
  });
  for (const [s, o] of r.vis) peak[s] = Math.max(peak[s] || 0, o);
  // Only judge the label once a dated frame is actually the dominant image.
  const top = r.vis.filter(([s]) => /^tl-\d+/.test(s)).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 0.6 && r.yr && r.yr[1] > 0.6 && !top[0].includes(r.yr[0])) mislabelled++;
  if (r.orphan) orphaned++;
  claimCount = r.claims;
  // Layers stack, so coverage is 1-prod(1-o), not the max single opacity.
  const cov = 1 - r.vis.reduce((a, [, o]) => a * (1 - o), 1);
  if (i && cov < 0.85) { blank++; console.log('  thin at p=' + (i/60).toFixed(3) + ' coverage=' + cov.toFixed(2)); }
  if (Math.abs(r.top) > 2) unpinned++;
  if (r.credit < 0.5) creditDim++;
}
const frames = Object.keys(peak).sort();
ok(frames.length === 11, `all 11 flight frames mounted (got ${frames.length})`);
for (const f of frames) ok(peak[f] > 0.99, `${f} reaches full opacity (${peak[f].toFixed(2)})`);
ok(blank === 0, `stage never thins below 85% coverage mid-act (${blank} thin samples of 60)`);
ok(unpinned === 0, `stage stays pinned for the whole act (${unpinned} unpinned samples)`);
ok(creditDim === 0, `source attribution visible at every sample (${creditDim} dim)`);
ok(claimCount > 0, `the orphan check actually found claims to judge (${claimCount})`);
ok(orphaned === 0, `no claim control outlives its sentence (${orphaned} orphaned samples)`);
ok(mislabelled === 0, `year readout always names the frame on screen (${mislabelled} mislabelled samples)`);
console.log(fail ? `RESULT FAIL (${fail})` : `RESULT PASS (${pass} assertions)`);
await b.close();
process.exit(fail ? 1 : 0);
