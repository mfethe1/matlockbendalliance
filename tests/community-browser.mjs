// Real-browser smoke checks for static community resources. No external forms.
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const base=process.argv[2] || 'http://127.0.0.1:8876/';
const output=process.env.VERIFY_OUTPUT || '/Users/mfethe/.hermes/cache/scratch/tnwaste-browser';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const routes=['','statewide/','community-resources/','community-resources/templates.html','evidence/','goals/','corrections/','about/accessibility-privacy.html'];
let failed=0;const findings=[];
function check(cond,msg){findings.push({pass:!!cond,msg});if(!cond)failed++;}
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:360,height:640}]){
  const page=await browser.newPage({viewport});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   errors.length=0;
   const response=await page.goto(new URL(route,base).href,{waitUntil:'load'});
   await page.waitForTimeout(250);
   check(response.status()===200,`${viewport.width} ${route||'/'} HTTP 200`);
   check(errors.length===0,`${route||'/'} JavaScript errors: ${errors.join(';')}`);
   const dom=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,forms:document.querySelectorAll('form').length,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,lang:document.documentElement.lang,unnamed:[...document.querySelectorAll('a')].filter(a=>!a.textContent.trim()&&!a.getAttribute('aria-label')).length}));
   if(dom.overflow>1) console.log('OVERFLOW',route,viewport.width,await page.evaluate(w=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>w+1 || e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,client:e.clientWidth,text:e.textContent.slice(0,70)})).slice(0,20),viewport.width));
   check(dom.overflow<=1,`${viewport.width} ${route||'/'} horizontal overflow ${dom.overflow}`);
   check(dom.forms===0,`${route||'/'} disabled intake`);
   check(dom.h1===1,`${route||'/'} one primary heading`);
   check(dom.lang==='en',`${route||'/'} document language`);
   if(!route){
    await page.selectOption('#foiaType','contracts');
    await page.locator('button[onclick="generateFOIA()"]').click();
    check((await page.locator('#foiaBody').innerText()).includes('operating agreements'),'homepage unsent records generator works');
    check((await page.locator('#foiaTemplate').innerText()).includes('Verified custodian'),'generator requires verified recipient');
    if(viewport.width<600){
     await page.locator('#navToggle').click();
     check(await page.locator('#navToggle').getAttribute('aria-expanded')==='true','mobile navigation opens');
     await page.keyboard.press('Escape');
     check(await page.locator('#navToggle').getAttribute('aria-expanded')==='false','mobile navigation closes with Escape');
    }
   }
   if(route){
    check(dom.main===1,`${route} main landmark`);
    check(dom.unnamed===0,`${route} named links`);
    await page.keyboard.press('Tab');
    check(await page.evaluate(()=>document.activeElement?.classList.contains('skip')),`${route} keyboard skip link first`);
    await page.keyboard.press('Enter');
    check(await page.evaluate(()=>location.hash==='#main'),`${route} skip target exists`);
    await page.emulateMedia({media:'print'});
    check(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 255, 255)'),`${route} printable light background`);
    await page.emulateMedia({media:'screen'});
   }
   if(viewport.width===390&&['statewide/','community-resources/'].includes(route))await page.screenshot({path:path.join(output,route.split('/')[0]+'-mobile.png'),fullPage:true});
  }
  await page.close();
 }
 const plain=await browser.newContext({javaScriptEnabled:false}); const page=await plain.newPage();
 await page.goto(new URL('community-resources/templates.html',base).href);
 check((await page.locator('main').innerText()).includes('Records request'),'no-JavaScript offline templates');
 await page.pdf({path:path.join(output,'county-checklists.pdf'),format:'Letter',printBackground:false});
 await plain.close();
} finally {await browser.close();}
await fs.writeFile(path.join(output,'result.json'),JSON.stringify({failed,checks:findings.length,findings},null,2));
console.log(`COMMUNITY BROWSER ${failed?'FAIL':'PASS'} ${findings.length} checks, ${failed} failures`);
process.exitCode=failed?1:0;
