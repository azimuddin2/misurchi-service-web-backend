import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubscriptionService } from './subscription.service';
import { SubPaymentsService } from '../subPayment/sub-payment.services';

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  req.body.user = req?.user?.userId;
  const result = await SubscriptionService.createSubscriptionIntoDB(req.body);

  const createPayment = await SubPaymentsService.subPayCheckout({
    // @ts-ignore
    plan: result?.plan,
    // @ts-ignore
    subscription: result._id,
    user: req?.user?.userId,
    durationType: result?.durationType,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription created successfully',
    data: createPayment,
  });
});

const getAllSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getAllSubscriptionFromDB(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscriptions fetched successfully',
    data: result,
  });
});

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getSubscriptionByUserIdFromDB(
    req.user?.userId,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscriptions fetched successfully',
    data: result,
  });
});

const updateSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.updateSubscriptionIntoDB(
    req.params.id,
    req.body,
  );

  // const updatePayment = await paymentsService.checkout({
  //   // @ts-ignore
  //   subscription: result._id,
  //   user: req?.user?.userId,
  //   durationType: result?.durationType,
  // });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription updated successfully',
    data: 'updatePayment',
  });
});

const getActiveSubscriptionByVendor = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result =
    await SubscriptionService.getActiveSubscriptionByVendorFromDB(vendorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Active subscription retrieved successfully',
    data: result,
  });
});

const cancelActiveSubscription = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result =
    await SubscriptionService.cancelActiveSubscriptionFromDB(vendorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result.subscription,
  });
});

const resumeSubscription = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result = await SubscriptionService.resumeSubscriptionFromDB(vendorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result.subscription,
  });
});

const getVendorSubscriptionStatus = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result =
    await SubscriptionService.getVendorSubscriptionStatusFromDB(vendorId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription status retrieved successfully',
    data: result,
  });
});

export const SubscriptionControllers = {
  createSubscription,
  getAllSubscription,
  updateSubscription,
  getMySubscription,
  getActiveSubscriptionByVendor,
  cancelActiveSubscription,
  resumeSubscription,
  getVendorSubscriptionStatus,
};
