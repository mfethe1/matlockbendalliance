/**
 * Airtable-backed email subscription API
 * Free tier: 1,000 records per base, 1,200 requests/month
 * 
 * Setup:
 * 1. Create free Airtable account at airtable.com
 * 2. Create a base called "TN Waste Watch Subscribers"
 * 3. Create a table called "Subscribers" with fields: Email, Source, Subscribed At
 * 4. Get your API key from airtable.com/create/tokens
 * 5. Get your Base ID from the API docs
 * 6. Set environment variables: AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 */

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

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

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return response.status(500).json({ 
      error: 'Server configuration incomplete',
      message: 'Contact the site administrator'
    });
  }

  try {
    const { email, source = 'tnwaste-org' } = request.body;

    if (!email || !email.includes('@')) {
      return response.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicates first
    const checkRes = await fetch(
      `${AIRTABLE_API_URL}/${baseId}/Subscribers?filterByFormula=${encodeURIComponent(`{Email}="${normalizedEmail}"`)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkData = await checkRes.json();

    if (checkData.records && checkData.records.length > 0) {
      return response.status(409).json({
        error: 'already_subscribed',
        message: "You're already on the list!"
      });
    }

    // Create new record
    const createRes = await fetch(
      `${AIRTABLE_API_URL}/${baseId}/Subscribers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Email: normalizedEmail,
            Source: source,
            'Subscribed At': new Date().toISOString()
          }
        })
      }
    );

    if (!createRes.ok) {
      throw new Error(`Airtable error: ${createRes.status}`);
    }

    return response.status(201).json({
      success: true,
      message: "You're on the list. We'll email you when there's a hearing or deadline."
    });

  } catch (error) {
    console.error('Subscription error:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
