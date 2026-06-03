import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { ReferralService } from './referral.service';

// ✅ 1. Referral link আনো
const getReferralLink = catchAsync(async (req, res) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;

  const result = await ReferralService.getReferralLink(vendorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral link fetched successfully',
    data: result,
  });
});

// ✅ 2. Email পাঠাও
const emailReferralLink = catchAsync(async (req, res) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;
  const { recipientEmail } = req.body;

  await ReferralService.emailReferralLink(vendorId, recipientEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral email sent successfully',
    data: null,
  });
});

// ✅ 3. Dashboard stats
const getReferralStats = catchAsync(async (req, res) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;
  const month = req.query.month as string | undefined;
  // optional: ?month=2025-05

  const result = await ReferralService.getReferralStats(vendorId, month);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral stats fetched successfully',
    data: result,
  });
});

export const ReferralController = {
  getReferralLink,
  emailReferralLink,
  getReferralStats,
};
