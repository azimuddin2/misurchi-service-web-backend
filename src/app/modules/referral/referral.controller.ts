import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { ReferralService } from './referral.service';
import { Request, Response } from 'express';

const getReferralLink = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;

  const result = await ReferralService.getReferralLink(vendorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral link fetched successfully',
    data: result,
  });
});

const emailReferralLink = catchAsync(async (req: Request, res: Response) => {
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

const getReferralStats = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;
  const month = req.query.month as string | undefined;

  const result = await ReferralService.getReferralStats(vendorId, month);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral stats fetched successfully',
    data: result,
  });
});

const getAllVendorReferralStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ReferralService.getAllVendorReferralStatsFromDB(
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All vendor referral stats fetched successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

const getVendorReferralDetail = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;

    const result = await ReferralService.getVendorReferralDetailFromDB(
      vendorId,
      req.query,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Vendor referral detail fetched successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

export const ReferralController = {
  getReferralLink,
  emailReferralLink,
  getReferralStats,
  getAllVendorReferralStats,
  getVendorReferralDetail,
};
