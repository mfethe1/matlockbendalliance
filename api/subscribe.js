/**
 * Serverless function for email capture
 * Deploy to Vercel, Netlify Functions, or Cloudflare Workers
 * 
 * For GitHub Pages (static hosting), use Formspree or Google Forms instead.
 * This file is provided for future use if you migrate to a serverless platform.
 */

export default async function handler(request, response) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, source = 'tnwaste-org' } = request.body;

    if (!email || !email.includes('@')) {
      return response.status(400).json({ error: 'Valid email required' });
    }

    // Store in a simple JSON file or external service
    // For now, log to console (replace with actual storage)
    const subscriber = {
      email: email.toLowerCase().trim(),
      source,
      subscribedAt: new Date().toISOString(),
      userAgent: request.headers['user-agent'],
      ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress
    };

    console.log('New subscriber:', subscriber);

    // TODO: Store in database or send to email service
    // Options:
    // 1. Airtable API (free tier)
    // 2. Notion database
    // 3. Google Sheets via API
    // 4. Email yourself via SendGrid/Resend

    return response.status(200).json({
      success: true,
      message: "You're on the list. We'll email you when there's a hearing or deadline."
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return response.status(500).json({ error: 'Something went wrong' });
  }
}
