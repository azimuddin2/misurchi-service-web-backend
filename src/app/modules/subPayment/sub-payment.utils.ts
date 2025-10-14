import Stripe from 'stripe';
import config from '../../config';
import { Types } from 'mongoose';

export const stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

interface ICheckoutPayload {
  priceId: string;
  paymentId: Types.ObjectId;
}

export const createCheckoutSession = async (payload: ICheckoutPayload) => {
  const session = await stripe.checkout.sessions.create({
    metadata: {},
    line_items: [
      {
        price: payload.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    payment_method_types: ['card'],
    success_url: `${config.server_url}/sub-payments/confirm-sub-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payload.paymentId}`,
    cancel_url: config.client_Url,
  });

  console.log('✅ Stripe session created:', session.id);

  return session;
};
