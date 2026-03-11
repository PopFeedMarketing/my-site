import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const PRICE_IDS = {
  starter: 'price_1T9ZXlF5VhN8tuoAFtkswsMv',   // Replace with your Starter price ID
  unlimited: 'price_1T9ZXzF5VhN8tuoA7iPcth8w', // Replace with your Unlimited price ID
};
