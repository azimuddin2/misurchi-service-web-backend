import Stripe from 'stripe';
import config from '../../config';
import httpStatus from 'http-status';
import mongoose, { startSession } from 'mongoose';
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
import { TSubscribed } from '../user/user.interface';

const stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

const subPayCheckout = async (payload: TSubPayment) => {
  const tranId = `TXN-${generateRandomString(10)}`;

  // 1️⃣ Validate User
  const user = await User.findById(payload.user);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found!');

  const vendor = await VendorServices.getVendorProfileFromDB(user?.email);
  if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

  // 2️⃣ Validate Plan
  const plan = await Plan.findById(payload.plan);
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, 'Plan not found!');

  if (plan.cost > 0 && !plan.stripePriceId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Stripe price not found for this plan.',
    );
  }

  // 3️⃣ ✅ Active subscription check
  const now = new Date();
  const activeSubscription = await Subscription.findOne({
    user: payload.user,
    isPaid: true,
    status: 'active',
    expiredAt: { $gt: now },
    isDeleted: false,
  });

  if (activeSubscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `You already have an active subscription. It expires on ${activeSubscription.expiredAt?.toDateString()}.`,
    );
  }

  // 4️⃣ ✅ Calculate expiry date
  const expiredAt = new Date();
  if (payload.durationType === 'yearly') {
    expiredAt.setFullYear(expiredAt.getFullYear() + 1);
  } else {
    expiredAt.setMonth(expiredAt.getMonth() + 1);
  }

  // 5️⃣ ✅ Create Subscription record first
  const subscription = await Subscription.create({
    user: payload.user,
    plan: payload.plan,
    amount: plan.cost || 0,
    durationType: payload.durationType,
    isPaid: false,
    status: 'pending',
    expiredAt,
  });

  if (!subscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create subscription record.',
    );
  }

  // 6️⃣ Create Payment Entry
  const modifyPayload: Partial<TSubPayment> = {
    ...payload,
    vendor: vendor._id as any,
    tranId,
    amount: plan.cost || 0,
    subscription: subscription._id as any,
  };

  const createdPayment = await SubPayment.create(modifyPayload);
  if (!createdPayment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create payment record.',
    );
  }

  // 7️⃣ Create Checkout Session
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

  return checkoutSession.url;
};

const confirmPayment = async (query: Record<string, any>) => {
  const { sessionId, paymentId } = query;
  const session = await startSession();

  // Retrieve payment session from Stripe
  const paymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = paymentSession.payment_intent as string;

  // Verify payment is completed
  if (paymentSession.payment_status !== 'paid') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not completed yet');
  }

  try {
    session.startTransaction();

    // Verify payment record exists
    const payment = await SubPayment.findById(paymentId).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');
    }

    // Get user and subscription IDs from payment record
    const userId = payment.user;
    const subscriptionId = payment.subscription;

    // Mark payment as paid
    await SubPayment.findByIdAndUpdate(
      paymentId,
      { $set: { isPaid: true, paidAt: new Date() } },
      { new: true, session },
    );

    // Verify user record exists
    const isUserExist = await User.findById(userId).session(session);
    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'User record not found!');
    }

    // Verify subscription record exists and populate plan
    const isSubscriptionExist = await Subscription.findById(subscriptionId)
      .populate('plan')
      .session(session);
    if (!isSubscriptionExist) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Subscription record not found!',
      );
    }

    // Determine subscribed value based on plan cost
    const plan = isSubscriptionExist.plan as any;
    const subscribedValue: TSubscribed = plan.cost > 0 ? 'advance' : 'basic';

    // Update user subscription status
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isSubscribed: true,
          subscribed: subscribedValue, // ✅ dynamic value
        },
      },
      { new: true, session },
    );

    // Update subscription to active
    await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          isPaid: true,
          status: 'active',
          startedAt: new Date(),
          isExpired: false,
        },
      },
      { new: true, session },
    );

    await session.commitTransaction();
    return payment;
  } catch (error: any) {
    await session.abortTransaction();

    // Refund payment if transaction fails
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

const cancelSubPayment = async (paymentId: string) => {
  if (!mongoose.Types.ObjectId.isValid(paymentId))
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid paymentId');

  const payment = await SubPayment.findById(paymentId);
  if (!payment)
    throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');

  if (payment.isPaid)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot cancel an already paid subscription',
    );

  payment.isDeleted = true;
  await payment.save();

  return payment;
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
  cancelSubPayment,
  getAllSubPaymentFromDB,
};
