// import catchAsync from '../../utils/catchAsync';
// import sendResponse from '../../utils/sendResponse';
// import httpStatus from 'http-status';
// import { ReferralService } from './referral.service';

// // ✅ 1. Referral link আনো
// const getReferralLink = catchAsync(async (req, res) => {
//   const vendorId = req.user.vendorId; // JWT থেকে

//   const result = await ReferralService.getReferralLink(vendorId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Referral link fetched',
//     data: result,
//   });
// });

// // ✅ 2. Email পাঠাও
// const emailReferralLink = catchAsync(async (req, res) => {
//   const vendorId = req.user.vendorId;
//   const { recipientEmail } = req.body;

//   await ReferralService.emailReferralLink(vendorId, recipientEmail);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Referral email sent successfully',
//     data: null,
//   });
// });

// // ✅ 3. Dashboard stats
// const getReferralStats = catchAsync(async (req, res) => {
//   const vendorId = req.user.vendorId;
//   const month = req.query.month as string | undefined;

//   const result = await ReferralService.getReferralStats(vendorId, month);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Referral stats fetched',
//     data: result,
//   });
// });

// export const ReferralController = {
//   getReferralLink,
//   emailReferralLink,
//   getReferralStats,
// };