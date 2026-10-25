import mongoose, { Types } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { Plan } from '../plan/plan.model';
import { USER_ROLE } from '../user/user.constant';
import { User } from '../user/user.model';
import { TSubscription } from './subscription.interface';
import { Subscription } from './subscription.model';
import httpStatus from 'http-status';
import { addMonths } from './subscription.utils';
import { TPlan } from '../plan/plan.interface';

const createSubscriptionIntoDB = async (payload: TSubscription) => {
  const activeSubscription = await Subscription.findOne({
    user: payload.user,
    status: 'active',
    isExpired: false,
    isDeleted: false,
  }).populate('plan');

  if (activeSubscription) {
    const currentPlan = activeSubscription.plan as TPlan;
    const newPlan = await Plan.findById(payload.plan);

    // ❌ Free → Free block
    if (currentPlan.validity === 'free' && newPlan?.validity === 'free') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You are already on a free plan.',
      );
    }

    // ❌ Paid → Paid block
    if (currentPlan.validity !== 'free' && newPlan?.validity !== 'free') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You already have an active subscription. It expires on ${activeSubscription.expiredAt?.toDateString()}.`,
      );
    }

    // ✅ Free → Paid upgrade allow
    if (currentPlan.validity === 'free' && newPlan?.validity !== 'free') {
      await Subscription.findByIdAndUpdate(activeSubscription._id, {
        status: 'canceled',
      });
    }
  }

  // 2️⃣ Check for existing unpaid subscription for this plan
  const existing = await Subscription.findOne({
    user: payload.user,
    plan: payload.plan,
    isPaid: false,
    isDeleted: false,
  });

  if (existing) return existing;

  // 3️⃣ Validate Plan
  const plan = await Plan.findById(payload.plan);
  if (!plan) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Plan not found.');
  }

  if (plan.isDeleted || !plan.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This plan is not active.');
  }

  // 4️⃣ Validate User
  const user = await User.findById(payload.user);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found.');
  }

  // 5️⃣ Only vendors can subscribe
  if (user.role !== USER_ROLE.vendor) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only vendors can subscribe to plans.',
    );
  }

  // 6️⃣ Calculate subscription expiry
  const now = new Date();
  let expiredAt: Date;

  switch (plan.validity) {
    case '1month':
      expiredAt = addMonths(now, 1);
      break;
    case '1year':
      expiredAt = addMonths(now, 12);
      break;
    case 'free':
      expiredAt = addMonths(now, 1);
      break;
    default:
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid validity type: ${plan.validity}`,
      );
  }

  // 7️⃣ Prepare subscription payload
  const subscriptionPayload: TSubscription = {
    ...payload,
    amount: plan.cost,
    status: 'pending',
    startedAt: now,
    expiredAt,
    isExpired: false,
    isDeleted: false,
    durationType: plan.validity === '1year' ? 'yearly' : 'monthly',
  };

  // 8️⃣ Save subscription
  const subscription = await Subscription.create(subscriptionPayload);
  if (!subscription) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create subscription.',
    );
  }

  return subscription;
};

const getAllSubscriptionFromDB = async (query: Record<string, unknown>) => {
  const subscriptionsModel = new QueryBuilder(
    Subscription.find({ isDeleted: false }),
    query,
  )
    .search([])
    .filter()
    .paginate()
    .sort()
    .fields();

  const result = await subscriptionsModel.modelQuery;
  const meta = await subscriptionsModel.countTotal();
  return {
    result,
    meta,
  };
};

const getSubscriptionByIdFromDB = async (id: string) => {
  const result = await Subscription.findById(id).populate(['plan', 'user']);
  return result;
};

const getSubscriptionByUserIdFromDB = async (id: string) => {
  const result = await Subscription.findOne({
    user: new Types.ObjectId(id),
  })
    .populate('plan')
    .populate('user', 'email');

  return result;
};

const updateSubscriptionIntoDB = async (
  id: string,
  payload: Partial<TSubscription>,
) => {
  const result = await Subscription.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!result) {
    throw new Error('Failed to update subscription');
  }
  return result;
};

const deleteSubscriptionFromDB = async (id: string) => {
  const result = await Subscription.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new Error('Failed to delete subscription');
  }
  return result;
};

const getActiveSubscriptionByVendorFromDB = async (vendorId: string) => {
  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  const activeSubscription = await Subscription.findOne({
    vendor: vendorId,
    isDeleted: false,
    status: 'active',
    isExpired: false,
  })
    .populate('plan')
    .sort({ createdAt: -1 });

  return activeSubscription;
};

const cancelActiveSubscriptionFromDB = async (vendorId: string) => {
  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  const now = new Date();

  const activeSubscription = await Subscription.findOne({
    vendor: vendorId,
    isPaid: true,
    status: 'active',
    isDeleted: false,
    expiredAt: { $gt: now },
  });

  if (!activeSubscription) {
    throw new AppError(404, 'No active subscription found');
  }

  if (activeSubscription.cancelAtPeriodEnd) {
    throw new AppError(
      400,
      'Subscription is already scheduled for cancellation',
    );
  }

  const updatedSubscription = await Subscription.findByIdAndUpdate(
    activeSubscription._id,
    {
      $set: {
        cancelAtPeriodEnd: true,
        canceledAt: now,
      },
    },
    { new: true },
  ).populate('plan');

  return {
    message: `Your subscription will remain active until ${activeSubscription.expiredAt?.toDateString()}. It will not auto-renew after that.`,
    subscription: updatedSubscription,
  };
};

const resumeSubscriptionFromDB = async (vendorId: string) => {
  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  const now = new Date();

  const subscription = await Subscription.findOne({
    vendor: vendorId,
    status: 'active',
    isDeleted: false,
    cancelAtPeriodEnd: true,
    expiredAt: { $gt: now },
  });

  if (!subscription) {
    throw new AppError(404, 'No cancellation scheduled to resume');
  }

  const updatedSubscription = await Subscription.findByIdAndUpdate(
    subscription._id,
    {
      $set: { cancelAtPeriodEnd: false },
      $unset: { canceledAt: '' },
    },
    { new: true },
  ).populate('plan');

  return {
    message: 'Subscription resumed successfully. It will auto-renew as usual.',
    subscription: updatedSubscription,
  };
};

const getVendorSubscriptionStatusFromDB = async (vendorId: string) => {
  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  const latestSubscription = await Subscription.findOne({
    vendor: vendorId,
    isDeleted: false,
  })
    .populate('plan')
    .sort({ createdAt: -1 });

  if (!latestSubscription) {
    return {
      hasSubscription: false,
      status: 'none' as const,
      subscription: null,
    };
  }

  const now = new Date();
  const isActuallyExpired =
    latestSubscription.isExpired || latestSubscription.expiredAt < now;

  if (
    latestSubscription.status === 'active' &&
    !isActuallyExpired &&
    !latestSubscription.cancelAtPeriodEnd
  ) {
    return {
      hasSubscription: true,
      status: 'active' as const,
      subscription: latestSubscription,
    };
  }

  if (
    latestSubscription.status === 'active' &&
    !isActuallyExpired &&
    latestSubscription.cancelAtPeriodEnd
  ) {
    return {
      hasSubscription: true,
      status: 'canceling' as const,
      subscription: latestSubscription,
    };
  }

  if (isActuallyExpired && latestSubscription.cancelAtPeriodEnd) {
    return {
      hasSubscription: false,
      status: 'canceled' as const,
      subscription: latestSubscription,
    };
  }

  if (isActuallyExpired) {
    return {
      hasSubscription: false,
      status: 'expired' as const,
      subscription: latestSubscription,
    };
  }

  return {
    hasSubscription: false,
    status: latestSubscription.status,
    subscription: latestSubscription,
  };
};

export const SubscriptionServices = {
  createSubscriptionIntoDB,
  getAllSubscriptionFromDB,
  getSubscriptionByIdFromDB,
  getSubscriptionByUserIdFromDB,
  updateSubscriptionIntoDB,
  deleteSubscriptionFromDB,
  getActiveSubscriptionByVendorFromDB,
  cancelActiveSubscriptionFromDB,
  resumeSubscriptionFromDB,
  getVendorSubscriptionStatusFromDB,
};
