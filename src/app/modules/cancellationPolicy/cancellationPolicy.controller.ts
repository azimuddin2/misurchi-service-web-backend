import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CancellationPolicyService } from './cancellationPolicy.service';

const upsertCancellationPolicy = catchAsync(async (req, res) => {
  const result = await CancellationPolicyService.upsertCancellationPolicyIntoDB(
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cancellation policy info saved successfully',
    data: result,
  });
});

const getCancellationPolicy = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result =
    await CancellationPolicyService.getCancellationPolicyFromDB(vendorId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cancellation policy info retrieved successfully',
    data: result,
  });
});

export const CancellationPolicyController = {
  upsertCancellationPolicy,
  getCancellationPolicy,
};
