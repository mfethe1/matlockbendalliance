// Real-browser smoke checks for static community resources. No external forms.
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const base=process.argv[2] || 'http://127.0.0.1:8876/';
const output=process.env.VERIFY_OUTPUT || '/Users/mfethe/.hermes/cache/scratch/tnwaste-browser';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const routes=['','statewide/','community-resources/','community-resources/templates.html','community-resources/visitor-drafts.html','community-resources/visitor-evidence.html','evidence/','goals/','corrections/','about/accessibility-privacy.html'];
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
   if(route==='community-resources/') {
    check((await page.locator('#watercheck').innerText()).includes('$255'),'NTL price and household option visible');
    check((await page.locator('#tapscore').innerText()).includes('$209'),'second household kit visible');
    check((await page.locator('#cu-loan').innerText()).includes('$34,345 as the household limit'),'loan income limit distinguished from median');
    check(await page.locator('#county-records a[href="mailto:publicrecordsrequests@loudoncounty-tn.gov"]').count()===1,'verified county submission route visible');
    const jump=page.locator('nav[aria-label="Find an answer"] a[href="#well-testing"]');
    await jump.focus(); await page.keyboard.press('Enter');
    check(new URL(page.url()).hash==='#well-testing','keyboard visitor jump reaches well choices');
   }
   if(route==='community-resources/visitor-drafts.html') {
    await page.context().grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
    const typed='My unsent household question: confirm hours, fees and acceptance. Nothing sent.';
    await page.locator('#disposal-draft-text').fill(typed);
    const copy=page.locator('[data-copy="disposal-draft-text"]');
    await copy.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('#disposal-draft-status').textContent.startsWith('Copied locally.'));
    check(await page.evaluate(()=>navigator.clipboard.readText())===typed,'keyboard copy copies actual edited draft to clipboard');
    check((await page.locator('#disposal-draft-status').innerText()).includes('Nothing sent.'),'copy explicitly remains unsent');
    await page.emulateMedia({media:'print'});
    check(await page.locator('#disposal-draft .print-draft').isVisible(),'full printable draft mirror visible');
    check((await page.locator('#disposal-draft .print-draft').innerText())===typed,'printed draft reflects local edit');
    check(!(await page.locator('#disposal-draft-text').isVisible()),'print avoids clipped textarea');
    await page.emulateMedia({media:'screen'});
    // Deny real browser permissions rather than mocking the clipboard API.
    await page.context().clearPermissions();
    const permissions=await page.context().newCDPSession(page);
    const {targetInfo}=await permissions.send('Target.getTargetInfo');
    for (const allowWithoutSanitization of [true,false]) {
     await permissions.send('Browser.setPermission',{permission:{name:'clipboard-write',allowWithoutSanitization},setting:'denied',origin:new URL(base).origin,browserContextId:targetInfo.browserContextId});
    }
    await copy.click();
    await page.waitForFunction(()=>document.querySelector('#disposal-draft-status').textContent.startsWith('Clipboard access unavailable.'));
    check(await page.evaluate(()=>document.activeElement.id==='disposal-draft-text' && document.activeElement.selectionEnd===document.activeElement.value.length),'denied clipboard selects draft for manual copy');
   }
   if(viewport.width===390&&['statewide/','community-resources/','community-resources/visitor-drafts.html'].includes(route))await page.screenshot({path:path.join(output,route.replaceAll('/','-').replace('.html','')+'mobile.png'),fullPage:true});
  }
  await page.close();
 }
 const plain=await browser.newContext({javaScriptEnabled:false}); const page=await plain.newPage();
 await page.goto(new URL('community-resources/templates.html',base).href);
 check((await page.locator('main').innerText()).includes('Records request'),'no-JavaScript offline templates');
 await page.pdf({path:path.join(output,'county-checklists.pdf'),format:'Letter',printBackground:false});
 await page.goto(new URL('community-resources/visitor-drafts.html',base).href);
 check(await page.locator('textarea').count()===5,'no-JavaScript editable unsent drafts');
 check(await page.locator('button:visible').count()===0,'no-JavaScript has no broken copy button');
 await page.locator('#disposal-draft-text').fill('UNIQUE NO-JAVASCRIPT PRINT EDIT: household tires inquiry');
 await page.emulateMedia({media:'print'});
 check(await page.locator('textarea:visible').count()===5,'no-JavaScript prints actual editable controls');
 check((await page.locator('#disposal-draft-text').inputValue()).includes('UNIQUE NO-JAVASCRIPT PRINT EDIT'),'no-JavaScript print retains edited value');
 check(await page.locator('.print-draft:visible').count()===0,'no-JavaScript never prints stale template mirror');
 await page.pdf({path:path.join(output,'visitor-drafts.pdf'),format:'Letter',printBackground:false});
 await plain.close();
} finally {await browser.close();}
await fs.writeFile(path.join(output,'result.json'),JSON.stringify({failed,checks:findings.length,findings},null,2));
console.log(`COMMUNITY BROWSER ${failed?'FAIL':'PASS'} ${findings.length} checks, ${failed} failures`);
process.exitCode=failed?1:0;
