# Email Setup — TN Waste Watch

## Current state

**Form delivery is OFF.** Both forms — hearing alerts and contributions — tell
visitors plainly that nothing was sent, and store nothing. No addresses are
being collected anywhere.

Turning delivery on is a one-line change, below.

## Turn it on (Formspree, ~5 minutes)

1. Go to <https://formspree.io/register> and create a free account
   (50 submissions/month on the free tier).
2. **New Form** → name it e.g. "TN Waste Watch".
3. Copy the endpoint URL: `https://formspree.io/f/YOUR_FORM_ID`
4. In `index.html`, set:

   ```js
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
   ```

5. Optionally set `CONTACT_EMAIL` — shown as a mailto fallback whenever
   delivery is unconfigured or the endpoint errors.
6. Commit and push. Formspree emails you each submission.

Both forms POST JSON to that one endpoint, distinguished by a `form` field:
`hearing-alerts` or `contribution`.

## How failure behaves

`deliver()` returns true only when the POST actually succeeds. Anything else —
no endpoint configured, network failure, non-2xx response — shows the honest
"not sent" message with the mailto fallback.

**Receipt is never claimed unless the submission left the browser.** Verified
by fault injection: with the endpoint forced to return 500, both forms refuse
to confirm.

## Verifying

There is no test runner in this repo; these are ad-hoc browser checks:

- **unconfigured** — forms must not confirm, must not store, must not POST
- **configured** — forms must POST, and confirm only on success
- **endpoint 500** — must fall back, must not confirm

## Why the previous version was replaced

The earlier "four-tier system" did not work at all:

- `FORMSPREE_ENDPOINT`, `GOOGLE_FORM_URL`, and `ACTION_NETWORK_URL` were
  declared but **never read** — there was no `fetch` anywhere on the page, so
  pasting a URL did nothing.
- Submissions went to `localStorage` on the visitor's own device while the UI
  said *"You're on the list"* and *"recorded and pending review"*.
- The "N neighbors getting alerts" badge counted entries in **that visitor's
  own browser**, so every visitor saw "1 neighbor".
- The contributions list rendered that same localStorage, showing people their
  own submissions styled as a published community archive.
- This guide previously recommended seeding a fake subscriber count for
  "social proof". Don't: on an accountability site, inventing numbers
  undermines the evidence everything else rests on.

`api/*.js` (`subscribe.js`, `formspree-subscribe.js`, `airtable-subscribe.js`)
is **dead code**: the site deploys to GitHub Pages, which is static hosting and
cannot execute server endpoints. Kept only as reference if the site ever moves
to Vercel/Netlify/Railway.

## Free tier limits

| Service | Free tier | Notes |
|---------|-----------|-------|
| Formspree | 50 submissions/month | Fine for launch |
| Action Network | Unlimited | Full activism platform; overkill until there is list volume |
| Airtable | 1,000 records | Needs a serverless host, not GitHub Pages |
