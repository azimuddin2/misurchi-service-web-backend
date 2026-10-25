import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReturnPolicyServices } from './returnPolicy.service';

const upsertReturnPolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await ReturnPolicyServices.upsertReturnPolicyIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Return policy info saved successfully',
    data: result,
  });
});

const getReturnPolicy = catchAsync(async (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const result = await ReturnPolicyServices.getReturnPolicyFromDB(vendorId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Return policy info retrieved successfully',
    data: result,
  });
});

export const ReturnPolicyControllers = {
  upsertReturnPolicy,
  getReturnPolicy,
};
