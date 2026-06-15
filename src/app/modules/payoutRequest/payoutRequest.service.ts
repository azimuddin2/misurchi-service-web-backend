import Stripe from 'stripe';
import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import { PayoutRequest } from './payoutRequest.model';
import { Vendor } from '../vendor/vendor.model';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';

const stripe = new Stripe(config.stripe_api_secret as string, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

const createPayoutRequest = async (vendorId: Types.ObjectId) => {
  const vendor = await Vendor.findById(vendorId).select(
    'businessName email totalReferralPoints totalReferredUsers',
  );

  if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

  // Calculate worth equivalent — 1 point = $2.50
  const availableBalance = vendor.totalReferralPoints * 2.5;

  // Enforce minimum payout threshold of $200
  if (availableBalance < 2) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum payout is $200. You have $${availableBalance.toFixed(2)}`,
    );
  }

  // Prevent duplicate pending requests
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
    totalPoints: vendor.totalReferralPoints,
    availableBalance,
    method: 'Bank',
    status: 'pending',
  });

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
  const payoutRequest =
    await PayoutRequest.findById(requestId).populate('vendorId');

  if (!payoutRequest)
    throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');

  if (payoutRequest.status !== 'pending')
    throw new AppError(httpStatus.BAD_REQUEST, 'Request is already processed');

  // Get vendor's Stripe connected account details
  const vendor = payoutRequest.vendorId as any;
  const user = await User.findOne({ vendorId: vendor._id }).select(
    'stripeAccountId stripeOnboardingComplete',
  );

  // Validate vendor has a connected Stripe account
  if (!user?.stripeAccountId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Vendor has no Stripe account connected',
    );
  }

  // Validate vendor has completed Stripe onboarding
  if (!user?.stripeOnboardingComplete) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Vendor Stripe onboarding is not complete',
    );
  }

  // Convert amount to cents as required by Stripe
  const amountInCents = Math.round(payoutRequest.availableBalance * 100);

  // Transfer funds from platform account to vendor's connected Stripe account
  await stripe.transfers.create({
    amount: amountInCents,
    currency: config.currency as string,
    destination: user.stripeAccountId,
    description: `Referral payout for ${vendor.businessName}`,
  });

  // Mark request as approved
  payoutRequest.status = 'approved';
  await payoutRequest.save();

  // Reset vendor's referral points to zero after successful payout
  await Vendor.findByIdAndUpdate(vendor._id, {
    $set: { totalReferralPoints: 0 },
  });

  return payoutRequest;
};

const rejectPayoutRequest = async (requestId: string) => {
  const payoutRequest = await PayoutRequest.findById(requestId);

  if (!payoutRequest)
    throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');

  if (payoutRequest.status !== 'pending')
    throw new AppError(httpStatus.BAD_REQUEST, 'Request is already processed');

  payoutRequest.status = 'rejected';
  await payoutRequest.save();

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

export const PayoutRequestService = {
  createPayoutRequest,
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getPayoutRequestDetail,
  getVendorPayoutHistory,
};
