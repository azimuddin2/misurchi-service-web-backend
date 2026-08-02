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
import { NotificationServices } from '../notification/notification.service';
import { ModeType } from '../notification/notification.interface';
import { ReferralService } from '../referral/referral.service';

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

  // 3️⃣ Active subscription check
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

  // 4️⃣ Calculate expiry date
  const expiredAt = new Date();
  if (payload.durationType === 'yearly') {
    expiredAt.setFullYear(expiredAt.getFullYear() + 1);
  } else {
    expiredAt.setMonth(expiredAt.getMonth() + 1);
  }

  // 5️⃣ Create Subscription record (atomic - duplicate prevent)
  const subscription = await Subscription.findOneAndUpdate(
    {
      user: payload.user,
      plan: payload.plan,
      isPaid: false,
      status: 'pending',
      isDeleted: false,
    },
    {
      $setOnInsert: {
        user: payload.user,
        vendor: vendor._id,
        plan: payload.plan,
        amount: plan.cost || 0,
        durationType: payload.durationType,
        isPaid: false,
        status: 'pending',
        expiredAt,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );

  if (!subscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create subscription record.',
    );
  }

  // 6️⃣ Create Payment Entry
  await SubPayment.deleteOne({
    user: payload.user,
    subscription: subscription._id,
    isPaid: false,
  });

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

  // 7️⃣ If you have the Basic Plan, activate directly — no Stripe checkout required
  if (plan.cost === 0) {
    await Subscription.findByIdAndUpdate(subscription._id, {
      $set: {
        isPaid: true,
        status: 'active',
        startedAt: new Date(),
        isExpired: false,
      },
    });

    await User.findByIdAndUpdate(payload.user, {
      $set: {
        isSubscribed: true,
        subscribed: 'basic',
      },
    });

    await SubPayment.findByIdAndUpdate(createdPayment._id, {
      $set: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    return { message: 'Basic plan activated successfully' };
  }

  // 8️⃣ Paid Plan — Stripe Checkout Session
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

  const paymentSession = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntentId = paymentSession.payment_intent as string;

  if (paymentSession.payment_status !== 'paid') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not completed yet');
  }

  try {
    session.startTransaction();

    const payment = await SubPayment.findById(paymentId).session(session);
    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payment record not found!');
    }

    const userId = payment.user;
    const subscriptionId = payment.subscription;

    await SubPayment.findByIdAndUpdate(
      paymentId,
      { $set: { isPaid: true, paidAt: new Date() } },
      { new: true, session },
    );

    const isUserExist = await User.findById(userId).session(session);
    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'User record not found!');
    }

    const isSubscriptionExist = await Subscription.findById(subscriptionId)
      .populate('plan')
      .session(session);
    if (!isSubscriptionExist) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Subscription record not found!',
      );
    }

    const plan = isSubscriptionExist.plan as any;
    const subscribedValue: TSubscribed = plan.cost > 0 ? 'advance' : 'basic';

    // 👇 Calculate startedAt/expiredAt from the actual moment of payment confirmation
    const startedAt = new Date();
    const expiredAt = new Date(startedAt);

    if (isSubscriptionExist.durationType === 'yearly') {
      expiredAt.setFullYear(expiredAt.getFullYear() + 1);
    } else {
      expiredAt.setMonth(expiredAt.getMonth() + 1);
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isSubscribed: true,
          subscribed: subscribedValue,
        },
      },
      { new: true, session },
    );

    await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          isPaid: true,
          status: 'active',
          startedAt,
          expiredAt,
          isExpired: false,
        },
      },
      { new: true, session },
    );

    await NotificationServices.notifyAdmins(
      'New Subscription Payment',
      subscriptionId as any,
      ModeType.SubscriptionPayment,
      `${isUserExist.fullName} has successfully purchased the ${plan.name} subscription plan for $${plan.cost}.`,
    );

    const vendorUser = await User.findById(userId).select('vendorId');
    if (vendorUser?.vendorId) {
      await ReferralService.awardReferralPoint(vendorUser.vendorId);
    }

    await session.commitTransaction();
    return payment;
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

const getSubPaymentByVendorFromDB = async (query: Record<string, unknown>) => {
  const { vendorId, ...filters } = query;

  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  let subPaymentQuery = SubPayment.find({
    vendor: vendorId,
    isPaid: true,
    isDeleted: false,
  })
    .populate({
      path: 'plan',
      select: 'name',
    })
    .populate({
      path: 'subscription',
      select: 'startedAt expiredAt status cancelAtPeriodEnd isExpired',
    });

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
  getSubPaymentByVendorFromDB,
};
