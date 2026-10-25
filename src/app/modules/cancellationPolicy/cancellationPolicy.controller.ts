import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CancellationPolicyServices } from './cancellationPolicy.service';

const upsertCancellationPolicy = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await CancellationPolicyServices.upsertCancellationPolicyIntoDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cancellation policy info saved successfully',
      data: result,
    });
  },
);

const getCancellationPolicy = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const result =
      await CancellationPolicyServices.getCancellationPolicyFromDB(vendorId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cancellation policy info retrieved successfully',
      data: result,
    });
  },
);

export const CancellationPolicyControllers = {
  upsertCancellationPolicy,
  getCancellationPolicy,
};
