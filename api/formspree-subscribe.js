/**
 * Formspree-backed email subscription
 * Free tier: 50 submissions/month, no account required for basic use
 * 
 * Setup (one-time):
 * 1. Go to https://formspree.io and create a free account
 * 2. Create a new form (no code needed)
 * 3. Copy your form endpoint: https://formspree.io/f/YOUR_FORM_ID
 * 4. Paste it below in FORMSPREE_ENDPOINT
 * 5. Deploy this function or use the direct HTML form approach
 */

const FORMSPREE_ENDPOINT = process.env.FORMSPREE_ENDPOINT || '';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!FORMSPREE_ENDPOINT) {
    return response.status(500).json({
      error: 'Server configuration incomplete',
      message: 'Formspree endpoint not configured'
    });
  }

  try {
    const { email, source = 'tnwaste-org' } = request.body;

    if (!email || !email.includes('@')) {
      return response.status(400).json({ error: 'Valid email required' });
    }

    // Forward to Formspree
    const formspreeRes = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        source,
        _subject: 'TN Waste Watch - New Subscriber',
        message: `New subscriber from ${source}`
      })
    });

    if (formspreeRes.ok) {
      return response.status(201).json({
        success: true,
        message: "You're on the list. We'll email you when there's a hearing or deadline."
      });
    } else {
      const errorData = await formspreeRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Formspree error: ${formspreeRes.status}`);
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
