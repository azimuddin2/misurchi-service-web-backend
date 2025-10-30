import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StripeService } from './stripe.service';

const createVendorAccount = catchAsync(async (req, res) => {
  const { vendorId } = req.body;
  if (!vendorId) throw new Error('vendorId is required');

  const result = await StripeService.createVendorStripeAccount(vendorId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Stripe account created successfully',
    data: result,
  });
});

const getVendorAccountStatus = catchAsync(async (req, res) => {
  const { vendorId } = req.body;
  if (!vendorId) throw new Error('vendorId is required');

  const result = await StripeService.getVendorStripeAccountStatus(vendorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor Stripe account status fetched successfully',
    data: result,
  });
});

export const StripeController = {
  createVendorAccount,
  getVendorAccountStatus,
};
