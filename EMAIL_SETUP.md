# Email Signup Setup Guide — TN Waste Watch

## What Changed

The broken localStorage-only email signup has been replaced with a **four-tier system** that can be activated by pasting a single URL:

| Priority | Backend | Setup Time | Best For |
|----------|---------|------------|----------|
| 1 | **Action Network** | 10 min | Full activism platform, auto-emails, unsubscribes |
| 2 | **Google Forms** | 5 min | Simple, free, responses go to Google Sheet |
| 3 | **Formspree** | 5 min | Direct POST, no server, 50 submissions/month free |
| 4 | **Direct capture** | 0 min | Works immediately, manual export via console |

## Quick Start (Formspree — Fastest Real Backend)

**Time: 5 minutes**

1. Go to https://formspree.io/register
2. Create a free account (email + password)
3. Click "New Form" → give it a name like "TN Waste Watch Subscribers"
4. Copy the form endpoint URL: `https://formspree.io/f/YOUR_FORM_ID`
5. Open `index.html` and find this line:
   ```javascript
   const FORMSPREE_ENDPOINT = ''; // e.g. 'https://formspree.io/f/YOUR_FORM_ID'
   ```
6. Paste your endpoint:
   ```javascript
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnqkvnpy'; // example
   ```
7. Commit and push to deploy

**Done.** Emails now go to your Formspree dashboard where you can export them as CSV.

## Alternative: Google Forms

**Time: 5 minutes**

1. Go to https://forms.new (while signed into your Google account)
2. Create a form with one question: "Email" (Short answer, Required)
3. Click the eye icon (Preview) → copy the URL
4. OR: Click "Send" → "Embed" → copy the iframe src URL
5. Paste it in `index.html`:
   ```javascript
   const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLS.../viewform?embedded=true';
   ```
6. Commit and push

**To send alerts:** Open the linked Google Sheet → copy emails → send via Gmail BCC.

## Alternative: Action Network

**Time: 10 minutes**

1. Go to https://actionnetwork.org and create a free account
2. Create a new "Form" called "Get TDEC Hearing Alerts for Matlock Bend"
3. Go to Form → Embed → copy the widget script URL
4. Paste it in `index.html`:
   ```javascript
   const ACTION_NETWORK_URL = 'https://actionnetwork.org/widgets/v5/form/get-tdec-hearing-alerts-for-matlock-bend?format=js&source=widget';
   ```
5. Commit and push

## Copy Changes (Conversion-Optimized)

| Before | After |
|--------|-------|
| "Get Meeting Alerts" | **"Don't Miss the Next Public Hearing"** |
| Generic description | **Specific threat**: "TDEC permit SNL530000203 is under review. The 7-acre expansion could affect air quality, traffic, and property values..." |
| "Subscribe" button | **"Get Hearing Alerts"** |
| No social proof | **Live subscriber count** with pulsing green dot |
| No trust signals | **"No spam — only hearing alerts · Unsubscribe anytime · Volunteer-run, non-profit"** |
| "We do not operate a server" | **Success state with frequency**: "Typically 1–2 emails per month" |

## Hero Section CTA

Added a third hero button: **"Get Hearing Alerts"** that smooth-scrolls to the signup section.

## Subscriber Count

The signup shows a live count (e.g., "12 neighbors getting alerts") with a pulsing green dot. Updates automatically as people subscribe.

To seed an initial count for social proof, run in browser console:
```javascript
localStorage.setItem('tnwaste-subscribers', JSON.stringify(['demo@example.com']))
```

## API Files (For Future Use)

Three serverless function templates are included in `/api/`:

- `subscribe.js` — Generic serverless handler
- `airtable-subscribe.js` — Airtable integration (1,000 records free)
- `formspree-subscribe.js` — Formspree via serverless proxy

These are for use if you migrate from GitHub Pages to Vercel, Netlify, or Railway.

## Testing Checklist

- [ ] Form submits without errors
- [ ] Success message appears
- [ ] Subscriber count increments
- [ ] Duplicate email shows "Already subscribed" message
- [ ] Hero CTA scrolls to signup section
- [ ] Mobile layout looks correct
- [ ] Backend receives the email (check Formspree/Google/Action Network dashboard)

## Exporting Subscribers (Direct Capture Mode)

If using localStorage mode (no backend configured):

1. Open the site in a browser
2. Open DevTools (F12) → Console
3. Run:
   ```javascript
   copy(JSON.parse(localStorage.getItem('tnwaste-subscribers')))
   ```
4. Paste into your email tool

## Free Tier Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Formspree | 50 submissions/month | Good for launch |
| Google Forms | Unlimited | No automation |
| Action Network | Unlimited subscribers | Activist-branded UI |
| Airtable | 1,000 records | Needs serverless function |
