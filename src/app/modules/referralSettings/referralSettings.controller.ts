import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReferralSettingsServices } from './referralSettings.service';

const getReferralSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await ReferralSettingsServices.getReferralSettingsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Referral points and reward value retrieved successfully.',
    data: result,
  });
});

const updateReferralSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ReferralSettingsServices.updateReferralSettingsIntoDB(
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Referral points and reward value updated successfully.',
      data: result,
    });
  },
);

export const ReferralSettingsControllers = {
  getReferralSettings,
  updateReferralSettings,
};
