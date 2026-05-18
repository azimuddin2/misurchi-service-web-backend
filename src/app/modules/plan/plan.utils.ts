import Stripe from 'stripe';
import config from '../../config';

export const stripe: Stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export const createStripeProduct = async (
  planName: string,
  description: string,
  cost: number,
  interval: 'month' | 'year',
) => {
  // 1. Create Stripe product
  const product = await stripe.products.create({
    name: planName,
    description,
  });

  // 2. Create Stripe price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: cost * 100, // Stripe uses cents
    currency: 'usd',
    recurring: { interval },
  });

  return { productId: product.id, priceId: price.id };
};
