import Stripe from 'stripe';
import { Types, startSession } from 'mongoose';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import { PayoutRequest } from './payoutRequest.model';
import { Vendor } from '../vendor/vendor.model';
import { User } from '../user/user.model';
import { Referral } from '../referral/referral.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { NotificationServices } from '../notification/notification.service';
import { ModeType } from '../notification/notification.interface';

const stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

const createPayoutRequest = async (vendorId: Types.ObjectId) => {
  const vendor = await Vendor.findById(vendorId).select(
    'businessName email totalReferralPoints totalReferredUsers',
  );

  if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

  const unpaidReferrals = await Referral.find({
    referrerId: vendorId,
    status: 'completed',
    paidOut: false,
  }).select('_id pointsAwarded rewardValue');

  const totalPoints = unpaidReferrals.reduce(
    (sum, referral) => sum + (referral.pointsAwarded ?? 0),
    0,
  );

  const availableBalance = unpaidReferrals.reduce(
    (sum, referral) => sum + (referral.rewardValue ?? 0),
    0,
  );

  if (availableBalance < 2) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum payout is $200. You have $${availableBalance.toFixed(2)}`,
    );
  }

  const existingRequest = await PayoutRequest.findOne({
    vendorId,
    status: 'pending',
  });

  if (existingRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a pending payout request',
    );
  }

  const payoutRequest = await PayoutRequest.create({
    vendorId,
    vendorName: vendor.businessName,
    vendorEmail: vendor.email,
    totalPoints,
    availableBalance,
    method: 'stripe',
    status: 'pending',
    referralIds: unpaidReferrals.map((referral) => referral._id),
  });

  // Notify admins
  await NotificationServices.notifyAdmins(
    'New Payout Request',
    payoutRequest._id as any,
    ModeType.ReferralRequest,
    `${vendor.businessName} has requested a referral earnings withdrawal of $${availableBalance.toFixed(2)}, pending admin approval.`,
  );

  return payoutRequest;
};

const getAllPayoutRequests = async (query: Record<string, unknown>) => {
  const payoutQuery = PayoutRequest.find()
    .populate('vendorId', 'businessName email stripeAccountId')
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(payoutQuery, query)
    .search(['vendorName', 'vendorEmail'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const approvePayoutRequest = async (requestId: string) => {
  const payoutRequest = await PayoutRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'processing' },
    { new: true },
  ).populate('vendorId');

  if (!payoutRequest) {
    const existing = await PayoutRequest.findById(requestId);
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');
    }
    throw new AppError(httpStatus.BAD_REQUEST, 'Request is already processed');
  }

  const vendor = payoutRequest.vendorId as any;

  if (!vendor) {
    payoutRequest.status = 'pending';
    await payoutRequest.save();
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Vendor not found for this request',
    );
  }

  const vendorUser = await User.findById(vendor.userId).select(
    'stripeAccountId stripeOnboardingComplete',
  );

  if (!vendorUser) {
    payoutRequest.status = 'pending';
    await payoutRequest.save();
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No user account linked to this vendor',
    );
  }

  if (!vendorUser.stripeAccountId) {
    payoutRequest.status = 'pending';
    await payoutRequest.save();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Vendor has no Stripe account connected',
    );
  }

  if (!vendorUser.stripeOnboardingComplete) {
    payoutRequest.status = 'pending';
    await payoutRequest.save();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Vendor Stripe onboarding is not complete',
    );
  }

  const amountInCents = Math.round(payoutRequest.availableBalance * 100);

  const transfer = await stripe.transfers.create(
    {
      amount: amountInCents,
      currency: (config.currency as string) ?? 'usd',
      destination: vendorUser.stripeAccountId,
      description: `Referral payout for ${vendor.businessName}`,
    },
    { idempotencyKey: `payout-${payoutRequest._id}` },
  );

  const session = await startSession();

  try {
    await session.withTransaction(async () => {
      payoutRequest.status = 'approved';
      payoutRequest.stripeTransferId = transfer.id;
      payoutRequest.approvedAt = new Date();
      await payoutRequest.save({ session });

      await Vendor.findByIdAndUpdate(
        vendor._id,
        { $inc: { totalReferralPoints: -payoutRequest.totalPoints } },
        { session },
      );

      const referralIdsToMark = payoutRequest.referralIds ?? [];

      if (referralIdsToMark.length > 0) {
        await Referral.updateMany(
          { _id: { $in: referralIdsToMark }, paidOut: false },
          { paidOut: true, payoutRequestId: payoutRequest._id },
          { session },
        );
      }
    });
  } catch (error) {
    console.error(
      `⚠️ [approvePayoutRequest] Stripe transfer ${transfer.id} succeeded but DB update failed for request ${requestId}:`,
      (error as Error).message,
    );
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Payment was sent (transfer ${transfer.id}) but recording it failed. This needs manual reconciliation.`,
    );
  } finally {
    await session.endSession();
  }

  return payoutRequest;
};

const rejectPayoutRequest = async (requestId: string) => {
  const payoutRequest = await PayoutRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'rejected', rejectedAt: new Date() },
    { new: true },
  );

  if (!payoutRequest) {
    const existing = await PayoutRequest.findById(requestId);
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');
    }
    throw new AppError(httpStatus.BAD_REQUEST, 'Request is already processed');
  }

  return payoutRequest;
};

const getPayoutRequestDetail = async (requestId: string) => {
  const payoutRequest = await PayoutRequest.findById(requestId).populate(
    'vendorId',
    'businessName email totalReferralPoints',
  );

  if (!payoutRequest)
    throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');

  const vendor = payoutRequest.vendorId as any;

  if (!vendor) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Vendor for this payout request no longer exists',
    );
  }

  return {
    availableBalance: `$${payoutRequest.availableBalance.toFixed(2)}`,
    totalPoints: `${payoutRequest.totalPoints} point`,
    worthEquivalent: `$${payoutRequest.availableBalance.toFixed(2)}`,
    vendorName: vendor.businessName,
    status: payoutRequest.status,
  };
};

const getVendorPayoutHistory = async (vendorId: Types.ObjectId) => {
  const history = await PayoutRequest.find({ vendorId })
    .sort({ createdAt: -1 })
    .select('totalPoints availableBalance method status createdAt');

  const result = history.map((r, index) => ({
    id: r._id.toString(),
    serial: index + 1,
    totalPoints: `${r.totalPoints} points`,
    amount: `$${r.availableBalance.toFixed(2)}`,
    method: r.method,
    status: r.status,
    requestedAt: r.createdAt?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }));

  return result;
};

export const PayoutRequestServices = {
  createPayoutRequest,
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getPayoutRequestDetail,
  getVendorPayoutHistory,
};
