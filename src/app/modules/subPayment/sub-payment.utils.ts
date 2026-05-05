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

    // ✅ confirm route — server side redirect
    success_url: `${config.server_url}/api/v1/sub-payments/confirm-sub-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payload.paymentId}`,

    // ✅ cancel route — server side redirect with paymentId
    cancel_url: `${config.server_url}/api/v1/sub-payments/cancel?paymentId=${payload.paymentId}`,
  });

  console.log('✅ Stripe session created:', session.id);

  return session;
};
