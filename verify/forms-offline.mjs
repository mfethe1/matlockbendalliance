// Ad-hoc verification: do the forms tell the truth about what happened?
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const URL = process.argv[2];
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });

async function submit(page, which, endpointLive) {
  const posts = [];
  page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
  if (endpointLive) {
    // Pretend a Formspree endpoint is configured, and intercept it.
    await page.route('**/formspree.io/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.addInitScript(() => { window.__FS = 'https://formspree.io/f/TESTID'; });
  }
  await page.goto(URL, { waitUntil: 'networkidle' });
  if (endpointLive) await page.evaluate(() => { window.FORMSPREE_ENDPOINT = window.__FS; });
  return posts;
}

const ctx = await b.newContext();
const page = await ctx.newPage();
const posts = [];
page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
await page.goto(URL, { waitUntil: 'networkidle' });

// --- unconfigured state: must NOT claim success, must NOT store anything ---
await page.fill('#newsletterEmail', 'verify@example.com');
await page.click('#newsletterBtn');
await page.waitForTimeout(1200);
const nlText = await page.evaluate(() => (document.querySelector('.newsletter-success')||{}).textContent || '');
ok(!/on the list/i.test(nlText), 'signup does not falsely confirm ("' + nlText.slice(0,46).trim() + '")');
ok(/not set up|not connected|nothing was sent/i.test(nlText), 'signup states delivery is unavailable');
const ls = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tnwaste')));
ok(ls.length === 0, 'no address retained in localStorage (found ' + JSON.stringify(ls) + ')');
const cnt = await page.evaluate(() => { const e = document.getElementById('subscriberCount'); return e ? getComputedStyle(e).display : 'absent'; });
ok(cnt === 'none', 'fake subscriber count hidden (display=' + cnt + ')');

await page.fill('#feedbackSubject', 'Verify subject');
await page.selectOption('#feedbackType', 'document');
await page.fill('#feedbackMessage', 'Verify message body');
await page.click('#feedbackBtn');
await page.waitForTimeout(1200);
const fbText = await page.evaluate(() => (document.querySelector('.feedback-success')||{}).textContent || '');
ok(!/has been (recorded|received)/i.test(fbText), 'contribution does not falsely confirm receipt');
ok(/not submitted|not set up|nothing was sent/i.test(fbText), 'contribution states delivery is unavailable');
const ls2 = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tnwaste')));
ok(ls2.length === 0, 'no contribution retained in localStorage (found ' + JSON.stringify(ls2) + ')');
ok(posts.length === 0, 'no POST attempted while unconfigured');
const intro = await page.evaluate(() => (document.getElementById('contributeIntro')||{}).textContent || '');
ok(/not connected yet/i.test(intro), 'contribute intro drops the review promise');
const trust = await page.evaluate(() => ['trustSpam','trustUnsub'].filter(i => document.getElementById(i)).length);
ok(trust === 0, 'unsubscribe/no-spam claims removed while delivery is off');

console.log('');
console.log(fails ? 'RESULT FAIL (' + fails + ')' : 'RESULT PASS (' + 10 + ' assertions, 0 failures)');
await b.close();
process.exit(fails ? 1 : 0);
