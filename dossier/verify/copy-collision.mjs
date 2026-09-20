// Copy-collision guard for the approach act.
//
// The credit paragraph was absolutely positioned and overlapped the expansion
// claim by ~44,000px2 at every desktop viewport -- text printed straight
// through other text. Five harnesses passed throughout: they assert on frames,
// captions, opacity and pinning, and none compares the on-screen boxes of two
// copy elements. This one does, and fails if any two visible pieces of copy in
// the act intersect at all.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE);
const b = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--force-prefers-reduced-motion'] });
let fail = 0;
for (const [W,H] of [[1440,900],[1280,900],[1440,780],[1728,1080],[390,844],[360,640]]) {
  const page = await b.newPage({ viewport:{width:W,height:H} });
  await page.goto(process.argv[2], { waitUntil:'load' });
  const act = await page.evaluate(()=>{const s=document.querySelector('#h-approach');return {t:s.getBoundingClientRect().top+scrollY,h:s.offsetHeight};});
  let worst={ov:0};
  for (let p=0.55;p<=1.001;p+=0.005){
    await page.evaluate((y)=>scrollTo(0,y), act.t+act.h*p);
    await page.waitForTimeout(35);
    const r = await page.evaluate(()=>{
      const c=document.querySelector('.earth__credit'); const cr=c.getBoundingClientRect();
      let eff=1; for(let a=c;a&&a!==document.body;a=a.parentElement) eff*=+getComputedStyle(a).opacity;
      if(eff<0.05) return {ov:0};
      let o=0,what='';
      // every visible text/control in the copy stack, excluding the credit itself
      for(const e of document.querySelectorAll('#h-approach .hero__copy .sc-lede, #h-approach .hero__copy .claim__btn, #h-approach .hero__copy .slug')){
        if(e===c||c.contains(e)) continue;
        let ee=1; for(let a=e;a&&a!==document.body;a=a.parentElement) ee*=+getComputedStyle(a).opacity;
        if(ee<0.05) continue;
        const r=e.getBoundingClientRect();
        const ox=Math.max(0,Math.min(cr.right,r.right)-Math.max(cr.left,r.left));
        const oy=Math.max(0,Math.min(cr.bottom,r.bottom)-Math.max(cr.top,r.top));
        if(ox*oy>o){o=ox*oy; what=(e.textContent||'').trim().slice(0,32);}
      }
      return {ov:Math.round(o),what};
    });
    if(r.ov>worst.ov) worst={...r,p:p.toFixed(3)};
  }
  const okv = worst.ov === 0;
  if (!okv) fail++;
  console.log(`${okv ? 'ok   ' : 'FAIL '}${`${W}x${H}`.padEnd(10)} ` +
    (okv ? 'no copy overlaps' : `overlap ${worst.ov}px2 with "${worst.what}" at p=${worst.p}`));
  await page.close();
}
await b.close();
console.log(fail ? `RESULT FAIL (${fail})` : 'RESULT PASS (6 viewports)');
process.exit(fail ? 1 : 0);
