import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const VALID_PRICE_IDS = [
  process.env.STARTER_PRICE_ID,
  process.env.UNLIMITED_PRICE_ID,
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, userEmail } = req.body;

  // Validate priceId against known valid IDs — prevents spoofing arbitrary prices
  if (!priceId || !VALID_PRICE_IDS.includes(priceId)) {
    return res.status(400).json({ error: 'Invalid price ID' });
  }

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Missing userId or userEmail' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      metadata: { userId },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
