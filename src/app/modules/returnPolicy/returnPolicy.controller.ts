import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReturnPolicyService } from './returnPolicy.service';

const upsertReturnPolicy = catchAsync(async (req, res) => {
  const result = await ReturnPolicyService.upsertReturnPolicyIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Return policy info saved successfully',
    data: result,
  });
});

const getReturnPolicy = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result = await ReturnPolicyService.getReturnPolicyFromDB(vendorId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Return policy info retrieved successfully',
    data: result,
  });
});

export const ReturnPolicyController = {
  upsertReturnPolicy,
  getReturnPolicy,
};
