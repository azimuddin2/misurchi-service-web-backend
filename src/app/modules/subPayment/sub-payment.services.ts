import Stripe from 'stripe';
import config from '../../config';
import httpStatus from 'http-status';
import { startSession } from 'mongoose';
import { TSubPayment } from './sub-payment.interface';
import generateRandomString from '../../utils/generateRandomString';
import { User } from '../user/user.model';
import AppError from '../../errors/AppError';
import SubPayment from './sub-payment.module';
import { Plan } from '../plan/plan.model';
import { createCheckoutSession } from './sub-payment.utils';
import { Request } from 'express';
import { Subscription } from '../subscription/subscription.model';
import { VendorServices } from '../vendor/vendor.service';
import QueryBuilder from '../../builder/QueryBuilder';

const stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

const subPayCheckout = async (payload: TSubPayment) => {
  const tranId = `TXN-${generateRandomString(10)}`;

  // 1️⃣ Validate User
  const user = await User.findById(payload.user);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const vendor = await VendorServices.getVendorProfileFromDB(user?.email);
  if (!vendor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  // 2️⃣ Validate Plan
  const plan = await Plan.findById(payload.plan);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, 'Plan not found!');
  }

  if (!plan.stripePriceId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe price not found for this plan.',
    );
  }

  // 3️⃣ Create Payment Entry
  const modifyPayload: Partial<TSubPayment> = {
    ...payload,
    vendor: vendor?._id as any,
    tranId,
    amount: plan.cost || 0,
  };

  const createdPayment = await SubPayment.create(modifyPayload);
  if (!createdPayment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create payment record.',
    );
  }

  // 4️⃣ Create Checkout Session (pass both priceId + paymentId)
  const checkoutSession = await createCheckoutSession({
    priceId: plan.stripePriceId,
    paymentId: createdPayment._id as any,
  });

  if (!checkoutSession?.url) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create checkout session.',
    );
  }

  // 5️⃣ Return payment URL
  return checkoutSession.url;
};

const confirmPayment = async (query: Record<string, any>) => {
  console.log('query________', query);

  const { sessionId, paymentId } = query;
  const session = await startSession();

  // ✅ Stripe payment process
  const paymentSession = await stripe.checkout.sessions.retrieve(sessionId);

  const paymentIntentId = paymentSession.payment_intent as string;

  // ✅ Stripe now uses `payment_status` instead of `status`
  if (paymentSession.payment_status !== 'paid') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not completed yet');
  }

  try {
    session.startTransaction();

    // ✅ Verify payment record exists
    const payment = await SubPayment.findById(paymentId).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');
    }

    // ✅ Update payment inside the same transaction
    const updatedPayment = await SubPayment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          isPaid: true,
          paidAt: new Date(),
        },
      },
      { new: true, session }, // <-- 🔥 include session here
    );

    const userId = updatedPayment?.user;
    const subscriptionId = updatedPayment?.subscription;

    // ✅ Verify user record exists
    const isUserExist = await User.findById(userId).session(session);
    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'User record not found!');
    }

    // ✅ Update user inside the info
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isSubscribed: true,
          subscribed: 'advance',
        },
      },
      { new: true, session }, // <-- 🔥 include session here
    );

    // ✅ Verify subscription record exists
    const isSubscriptionExist =
      await Subscription.findById(subscriptionId).session(session);
    if (!isSubscriptionExist) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Subscription record not found!',
      );
    }

    // ✅ Update subscription inside the info
    await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          isPaid: true,
          status: 'active',
        },
      },
      { new: true, session }, // <-- 🔥 include session here
    );

    await session.commitTransaction();

    console.log('✅ Payment updated successfully:', updatedPayment);
    return updatedPayment;
  } catch (error: any) {
    await session.abortTransaction();

    if (paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError.message);
      }
    }

    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  } finally {
    session.endSession();
  }
};

const webhook = async (req: Request) => {
  const endpointSecret = config.stripe_webhook_secret!;
  const sig = req.headers['stripe-signature'] as string | undefined;

  if (!sig) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Missing Stripe signature header.',
    );
  }

  let event: Stripe.Event;

  try {
    // Ensure raw body is passed (you must extract raw body from the request middleware level)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💸 Subscription payment succeeded', invoice);
        // Optionally: Add coins/credits based on invoice.customer
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription canceled', subscription);
        // Optionally: Disable user's subscription
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error('Error handling Stripe webhook event', err);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Internal error processing webhook event: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`,
    );
  }
};

const getAllSubPaymentFromDB = async (query: Record<string, unknown>) => {
  const { ...filters } = query;

  // Base query -> always exclude deleted payments
  let subPaymentQuery = SubPayment.find({ isDeleted: false, isPaid: true })
    .populate('vendor', 'businessName email chooseOffer')
    .populate('user');

  const queryBuilder = new QueryBuilder(subPaymentQuery, filters)
    .search([''])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

export const SubPaymentsService = {
  subPayCheckout,
  confirmPayment,
  webhook,
  getAllSubPaymentFromDB,
};
