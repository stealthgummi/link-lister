const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Allow CORS for the Chrome Extension
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your extension ID
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ active: false, error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ active: false, error: 'No license key provided.' });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ active: false, error: 'Stripe is not configured on the server.' });
    }

    // Since it's a one-time purchase, we assume the licenseKey is a Checkout Session ID (cs_live_...) 
    // or a Payment Intent ID (pi_...)
    
    // Check if it's a Checkout Session
    if (licenseKey.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(licenseKey);
      if (session && session.payment_status === 'paid') {
        return res.status(200).json({
          active: true,
          message: 'License is valid.'
        });
      }
    }
    
    // Alternatively, check if it's a Payment Intent directly
    if (licenseKey.startsWith('pi_')) {
      const paymentIntent = await stripe.paymentIntents.retrieve(licenseKey);
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        return res.status(200).json({
          active: true,
          message: 'License is valid.'
        });
      }
    }

    // If we reach here, it's either invalid format or not paid
    return res.status(400).json({
      active: false,
      error: 'License key is invalid or payment has not been completed.'
    });

  } catch (error) {
    console.error('License Verification Error:', error);
    return res.status(500).json({ active: false, error: error.message || 'Internal Server Error' });
  }
};

module.exports = allowCors(handler);
