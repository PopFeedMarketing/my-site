import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const PRICE_IDS = {
  starter: 'prod_U7pCtSZaUxVG0D',   // Replace with your Starter price ID
  unlimited: 'price_prod_U7pCEnMf8zGVDi', // Replace with your Unlimited price ID
};
