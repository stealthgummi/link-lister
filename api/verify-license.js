const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Only purchases of this product unlock Link Lister Pro. Every other purchase on the
// Stripe account (books, services, etc.) is rejected.
const PRO_PRODUCT_ID = process.env.LINKLISTER_PRODUCT_ID || 'prod_UdVP4uXa0v0DDY';

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  return fn(req, res);
};

async function sessionHasPro(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] });
  if (!session || session.payment_status !== 'paid') return false;
  return (session.line_items?.data || []).some(li => li.price && li.price.product === PRO_PRODUCT_ID);
}

async function verify(licenseKey) {
  if (licenseKey.startsWith('cs_')) return sessionHasPro(licenseKey);
  if (licenseKey.startsWith('pi_')) {
    // A payment intent alone doesn't say what was bought; find its checkout session.
    const list = await stripe.checkout.sessions.list({ payment_intent: licenseKey, limit: 1 });
    return list.data[0] ? sessionHasPro(list.data[0].id) : false;
  }
  return false;
}

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ active: false, error: 'Method not allowed' });
  const licenseKey = String((req.body && req.body.licenseKey) || '').trim();
  if (!licenseKey) return res.status(400).json({ active: false, error: 'No license key provided.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ active: false, error: 'License server is not configured.' });

  try {
    if (await verify(licenseKey)) return res.status(200).json({ active: true, message: 'License is valid.' });
  } catch (error) {
    // Unknown IDs throw in Stripe; treat as invalid without leaking details.
    if (error && error.type !== 'StripeInvalidRequestError') console.error('License verification error:', error.message);
  }
  return res.status(400).json({ active: false, error: 'License key is invalid or payment has not been completed.' });
};

module.exports = allowCors(handler);
module.exports.verify = verify;
