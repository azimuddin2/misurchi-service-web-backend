import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';
import dayjs from 'dayjs';
import config from '../../config';

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const url = await PaymentService.createPayment(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Payment created successfully',
    data: url,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const { sessionId, paymentId } = req.query as {
    sessionId: string;
    paymentId: string;
  };

  const result = await PaymentService.confirmPayment({ sessionId, paymentId });

  const date = dayjs(result.createdAt).format('YYYY-MM-DD HH:mm:ss');

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Successful</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

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

    h1 {
      color: #111827;
      font-size: 26px;
      margin-bottom: 6px;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 24px;
    }

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
      text-transform: capitalize;
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
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 480px) {
      h1 {
        font-size: 22px;
      }
      .card {
        padding: 24px 16px;
      }
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="icon">✓</div>

    <h1>Payment Successful</h1>
    <p class="subtitle">Thank you for trusting us. Your payment is confirmed.</p>

    <div class="info">
      <p><span>Transaction ID</span><strong>${result.trnId}</strong></p>
      <p><span>Amount</span><strong>$${result.price}</strong></p>
      <p><span>Status</span><span class="badge">${result.status}</span></p>
      <p><span>Date</span><strong>${date}</strong></p>
    </div>

    <a class="btn" href="/">Go to App</a>
  </div>
</body>
</html>
  `);
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.query as { paymentId?: string };

  if (paymentId) {
    await PaymentService.cancelPayment(paymentId);
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Cancelled</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

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

   h1 {
      color: #111827;
      font-size: 26px;
      margin-bottom: 6px;
    }

    p.subtitle {
      color: #6b7280;
      font-size: 15px;
      margin-bottom: 24px;
    }

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

    .button-container {
      display: flex;
      justify-content: flex-end; /* Button aligned to right */
    }

    .btn {
      padding: 14px 28px;
 background: linear-gradient(to top, rgba(34, 199, 110, 0.9), #14532d);
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s ease;
      width: 100%;
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
      .button-container { justify-content: center; }
      .btn { width: 100%; text-align: center; }
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="icon">!</div>
    <h1>Payment Cancelled</h1>
    <p class="subtitle">You cancelled the payment. No amount was deducted.</p>

    <div class="info">
      <p><span>Payment ID</span><strong>${paymentId ?? 'N/A'}</strong></p>
      <p><span>Status</span><strong>CANCELLED</strong></p>
    </div>

    <div class="button-container">
      <a class="btn" href=${config.client_Url}>Back to Home Page</a>
    </div>
  </div>
</body>
</html>
`);
});

const getAllPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.getAllPaymentFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getAllPaymentByAdmin = catchAsync(async (req, res) => {
  const result = await PaymentService.getAllPaymentByAdminFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

export const PaymentController = {
  createPayment,
  confirmPayment,
  cancelPayment,
  getAllPayment,
  getAllPaymentByAdmin,
};
