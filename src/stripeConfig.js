import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const PRICE_IDS = {
  starter: import.meta.env.VITE_STARTER_PRICE_ID,
  unlimited: import.meta.env.VITE_UNLIMITED_PRICE_ID,
};
