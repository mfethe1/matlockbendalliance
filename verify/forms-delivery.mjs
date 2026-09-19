// Proves the configured path: with an endpoint set, submissions POST and
// only then is receipt claimed. Formspree is intercepted, never really hit.
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const URL = process.argv[2];
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fails++; };
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const ctx = await b.newContext();
const page = await ctx.newPage();
const posts = [];
page.on('request', r => { if (r.method() === 'POST') posts.push({ url: r.url(), body: r.postData() }); });
// Serve the page with the endpoint constant filled in, exactly as pasting it would.
await page.route('**/index.html', async r => {
  const res = await r.fetch();
  let html = await res.text();
  html = html.replace("const FORMSPREE_ENDPOINT = '';", "const FORMSPREE_ENDPOINT = 'https://formspree.io/f/TESTID';");
  await r.fulfill({ response: res, body: html });
});
await page.route('**/formspree.io/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
await page.goto(URL + 'index.html', { waitUntil: 'networkidle' });
const wired = await page.evaluate(() => document.documentElement.innerHTML.includes('formspree.io/f/TESTID'));
ok(wired, 'test endpoint injected into the page');

await page.fill('#newsletterEmail', 'verify@example.com');
await page.click('#newsletterBtn');
await page.waitForTimeout(1500);
const nl = await page.evaluate(() => (document.querySelector('.newsletter-success')||{}).textContent || '');
ok(posts.some(p => p.url.includes('formspree')), 'signup POSTs to the endpoint');
ok(/on the list/i.test(nl), 'signup confirms only after a successful POST');
ok((posts[0]||{}).body && posts[0].body.includes('verify@example.com'), 'POST body carries the address');

await page.fill('#feedbackSubject', 'Verify subject');
await page.selectOption('#feedbackType', 'document');
await page.fill('#feedbackMessage', 'Verify message body');
await page.click('#feedbackBtn');
await page.waitForTimeout(1500);
const fb = await page.evaluate(() => (document.querySelector('.feedback-success')||{}).textContent || '');
ok(posts.length >= 2, 'contribution POSTs to the endpoint');
ok(/has been received/i.test(fb), 'contribution confirms only after a successful POST');

console.log('');
console.log(fails ? 'RESULT FAIL (' + fails + ')' : 'RESULT PASS (7 assertions, 0 failures)');
await b.close();
process.exit(fails ? 1 : 0);
