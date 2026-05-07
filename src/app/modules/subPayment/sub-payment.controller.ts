import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { SubPaymentsService } from './sub-payment.services';
import config from '../../config';
import dayjs from 'dayjs';

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
  const result = await SubPaymentsService.confirmPayment(req?.query);

  const date = dayjs(result?.createdAt).format('YYYY-MM-DD HH:mm:ss');

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Activated</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      min-height: 100vh;
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #14532d);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
      animation: fadeUp 0.6s ease;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #16a34a;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 16px;
    }
    h1 { color: #111827; font-size: 26px; margin-bottom: 6px; }
    .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .info {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      text-align: left;
      font-size: 14px;
    }
    .info p {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      color: #374151;
    }
    .info p:last-child {
      margin-bottom: 0;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-weight: 600;
    }
    .badge {
      background: #dcfce7;
      color: #15803d;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .btn {
      margin-top: 24px;
      display: block;
      width: 100%;
      padding: 14px;
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #14532d);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: 0.2s ease;
    }
    .btn:hover {
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #0a4120);
      transform: translateY(-1px);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      h1 { font-size: 22px; }
      .card { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Subscription Activated!</h1>
    <p class="subtitle">Your subscription is now active. Enjoy all premium features.</p>
    <div class="info">
      <p><span>Transaction ID</span><strong>${result?.tranId}</strong></p>
      <p><span>Amount</span><strong>$${result?.amount}</strong></p>
      <p><span>Status</span><span class="badge">Active</span></p>
      <p><span>Date</span><strong>${date}</strong></p>
    </div>
    <a class="btn" href="${config.client_Url}/vendor/profile">Back to Dashboard</a>
  </div>
</body>
</html>
  `);
});

const webhook = catchAsync(async (req: Request, res: Response) => {
  await SubPaymentsService.webhook(req);
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.query as { paymentId?: string };

  if (paymentId) {
    await SubPaymentsService.cancelSubPayment(paymentId);
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Subscription Cancelled</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      min-height: 100vh;
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #14532d);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 440px;
      border-radius: 16px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
      animation: fadeUp 0.6s ease;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: #f59e0b;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 18px;
    }
    h1 { color: #111827; font-size: 26px; margin-bottom: 6px; }
    p.subtitle { color: #6b7280; font-size: 15px; margin-bottom: 24px; }
    .info {
      background: #fffbeb;
      border-radius: 12px;
      padding: 18px;
      text-align: left;
      font-size: 14px;
      margin-bottom: 24px;
      box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
    }
    .info p {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      color: #374151;
      font-weight: 500;
    }
    .info p:last-child {
      margin-bottom: 0;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
      font-weight: 600;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #14532d);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #0a4120);
      transform: translateY(-2px);
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      .card { padding: 24px 16px; }
      h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">!</div>
    <h1>Subscription Cancelled</h1>
    <p class="subtitle">You cancelled the subscription process. No amount was deducted.</p>
    <div class="info">
      <p><span>Payment ID</span><strong>${paymentId ?? 'N/A'}</strong></p>
      <p><span>Status</span><strong>CANCELLED</strong></p>
    </div>
    <a class="btn" href="${config.client_Url}/pricing">Back to Home Page</a>
  </div>
</body>
</html>
  `);
});

const getAllSubPayment = catchAsync(async (req, res) => {
  const result = await SubPaymentsService.getAllSubPaymentFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription Payment retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

export const SubPaymentsController = {
  subPayCheckout,
  confirmPayment,
  webhook,
  cancelPayment,
  getAllSubPayment,
};
