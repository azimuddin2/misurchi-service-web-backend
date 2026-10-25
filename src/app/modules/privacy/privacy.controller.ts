import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PrivacyServices } from './privacy.service';

const getPrivacy = catchAsync(async (req: Request, res: Response) => {
  const result = await PrivacyServices.getPrivacyFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Privacy policy retrieved successfully',
    data: result,
  });
});

const upsertPrivacy = catchAsync(async (req: Request, res: Response) => {
  const result = await PrivacyServices.upsertPrivacyIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Privacy policy saved successfully',
    data: result,
  });
});

const deletePrivacy = catchAsync(async (req: Request, res: Response) => {
  const result = await PrivacyServices.deletePrivacyFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Privacy policy deleted successfully',
    data: result,
  });
});

export const PrivacyControllers = {
  getPrivacy,
  upsertPrivacy,
  deletePrivacy,
};
