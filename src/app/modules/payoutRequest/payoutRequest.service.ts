import Stripe from 'stripe';
import { Types, startSession } from 'mongoose';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import { PayoutRequest } from './payoutRequest.model';
import { Vendor } from '../vendor/vendor.model';
import { User } from '../user/user.model';
import { Referral } from '../referral/referral.model';
import { ReferralSettings } from '../referralSettings/referralSettings.model';
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

  // Get pointValue from Admin Panel instead of hardcoding it, so payout
  // math always matches whatever rate Admin has currently configured
  // (the same rate the referral stats screens use).
  const referralSettings = await ReferralSettings.findOne();

  if (!referralSettings) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Referral settings not configured',
    );
  }

  const pointValue = referralSettings.pointValue;

  // Calculate worth equivalent using the Admin Panel's current pointValue
  const availableBalance = vendor.totalReferralPoints * pointValue;

  // Enforce minimum payout threshold
  // NOTE: threshold intentionally kept low (2) for testing — set to the
  // real business minimum (200) before production release.
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
    method: 'stripe',
    status: 'pending',
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
  // Atomic lock: flips 'pending' -> 'processing' in one step. If two
  // admins (or a double-click) call approve at the same time, only ONE
  // of them will actually find a 'pending' document to lock — the other
  // gets null back immediately, before any Stripe call is ever made.
  // This is what actually prevents a duplicate Stripe transfer, not the
  // status check alone.
  const payoutRequest = await PayoutRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    { status: 'processing' },
    { new: true },
  ).populate('vendorId');

  if (!payoutRequest) {
    // Either it never existed, or it's already pending->processed by
    // someone else — check original doc to give an accurate error.
    const existing = await PayoutRequest.findById(requestId);
    if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found');
    }
    throw new AppError(httpStatus.BAD_REQUEST, 'Request is already processed');
  }

  const vendor = payoutRequest.vendorId as any;

  if (!vendor) {
    payoutRequest.status = 'pending'; // release the lock, nothing charged yet
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

  // Idempotency key tied to this specific request's _id: if this call is
  // retried (network timeout, client retry, etc.), Stripe recognizes the
  // same key and returns the ORIGINAL transfer instead of creating a
  // second one. Without this, a retry after a timeout can move real
  // money twice for the same request.
  const transfer = await stripe.transfers.create(
    {
      amount: amountInCents,
      currency: (config.currency as string) ?? 'usd',
      destination: vendorUser.stripeAccountId,
      description: `Referral payout for ${vendor.businessName}`,
    },
    { idempotencyKey: `payout-${payoutRequest._id}` },
  );

  // From here on, money has moved — the remaining DB writes (mark
  // approved, decrement vendor points, mark referrals paid) all happen
  // in one transaction so they succeed or fail together, instead of
  // leaving the payout request stuck in 'processing' with the vendor's
  // points never actually decremented.
  const session = await startSession();

  try {
    await session.withTransaction(async () => {
      payoutRequest.status = 'approved';
      payoutRequest.stripeTransferId = transfer.id;
      payoutRequest.approvedAt = new Date();
      await payoutRequest.save({ session });

      // Decrement by exactly the points this request covers, not a flat
      // reset to 0 — any points the vendor earned AFTER this request was
      // created (and before it was approved) are preserved instead of
      // being wiped out.
      await Vendor.findByIdAndUpdate(
        vendor._id,
        { $inc: { totalReferralPoints: -payoutRequest.totalPoints } },
        { session },
      );

      // Mark the underlying completed referrals as paid, linked to this
      // payout request, so they drop out of "current balance"
      // calculations and instead show up as payout history. Oldest
      // first, capped to the number of points this payout covers, so
      // that referrals completed AFTER this payout was requested are
      // left untouched.
      const unpaidReferrals = await Referral.find({
        referrerId: vendor._id,
        status: 'completed',
        paidOut: false,
      })
        .sort({ completedAt: 1 })
        .session(session);

      let pointsToCover = payoutRequest.totalPoints;
      const referralIdsToMark: Types.ObjectId[] = [];

      for (const referral of unpaidReferrals) {
        if (pointsToCover <= 0) break;
        referralIdsToMark.push(referral._id as Types.ObjectId);
        pointsToCover -= referral.pointsAwarded ?? 0;
      }

      if (referralIdsToMark.length > 0) {
        await Referral.updateMany(
          { _id: { $in: referralIdsToMark } },
          { paidOut: true, payoutRequestId: payoutRequest._id },
          { session },
        );
      }
    });
  } catch (error) {
    // The Stripe transfer already succeeded at this point (money moved),
    // but our DB bookkeeping failed. We do NOT attempt to reverse the
    // Stripe transfer automatically — that's a financial operation that
    // needs human judgement. Instead we surface it loudly so it can be
    // manually reconciled using the stored transfer.id.
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
  // Same atomic-lock pattern as approve, so a reject can't race with an
  // in-flight approve (or another reject) for the same request.
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

export const PayoutRequestService = {
  createPayoutRequest,
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getPayoutRequestDetail,
  getVendorPayoutHistory,
};
