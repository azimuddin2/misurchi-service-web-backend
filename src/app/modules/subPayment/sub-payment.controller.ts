import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { SubPaymentsService } from './sub-payment.services';
import config from '../../config';

const subPayCheckout = catchAsync(async (req: Request, res: Response) => {
  req.body.user = req.user?.userId;
  const result = await SubPaymentsService.subPayCheckout(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'payment link get successful',
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  await SubPaymentsService.confirmPayment(req?.query);
  res.redirect(config.client_Url + '/payment/success');
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  await SubPaymentsService.webhook(req);
});

export const SubPaymentsController = {
  subPayCheckout,
  confirmPayment,
  webhook,
};
