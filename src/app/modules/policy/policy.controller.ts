import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PolicyService } from './policy.service';

const getPolicy = catchAsync(async (req:Request, res:Response) => {
  const result = await PolicyService.getPolicyFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Policy retrieved successfully',
    data: result,
  });
});

const upsertPolicy = catchAsync(async (req:Request, res:Response) => {
  const result = await PolicyService.upsertPolicyIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Policy saved successfully',
    data: result,
  });
});

const deletePolicy = catchAsync(async (req:Request, res:Response) => {
  const result = await PolicyService.deletePolicyFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Policy deleted successfully',
    data: result,
  });
});

export const PolicyController = {
  getPolicy,
  upsertPolicy,
  deletePolicy,
};
