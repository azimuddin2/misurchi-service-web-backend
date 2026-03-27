import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { stripeService } from './stripe.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../errors/AppError';

const stripLinkAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await stripeService.stripLinkAccount(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Stripe onboarding link generated',
  });
});

const refresh = catchAsync(async (req: Request, res: Response) => {
  const url = await stripeService.refresh(req.params.id, req.query);
  return res.redirect(url);
});

const returnUrl = catchAsync(async (req: Request, res: Response) => {
  const { userId, stripeAccountId } = req.query;

  if (!userId || !stripeAccountId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing query params');
  }

  const result = await stripeService.returnUrl({
    userId: userId as string,
    stripeAccountId: stripeAccountId as string,
  });

  // 🔴 Incomplete onboarding
  if (!result.isCompleted) {
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stripe Setup Incomplete</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #4625A0, #7c5cff);
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
      background: #f59e0b;
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
      background: #fffbeb;
      border-radius: 12px;
      padding: 20px;
      text-align: left;
      font-size: 14px;
      margin-bottom: 24px;
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
      background: #fef3c7;
      color: #b45309;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .btn {
      margin-top: 8px;
      display: block;
      width: 100%;
      padding: 14px;
      background: #4625A0;
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: 0.2s ease;
    }
    .btn:hover { background: #361f85; transform: translateY(-1px); }
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
    <div class="icon">!</div>
    <h1>Setup Incomplete</h1>
    <p class="subtitle">Your Stripe onboarding is not fully completed yet.</p>
    <div class="info">
      <p><span>Account ID</span><strong>${stripeAccountId}</strong></p>
      <p><span>Status</span><span class="badge">INCOMPLETE</span></p>
    </div>
    <a class="btn" href="${config.client_Url}/vendor/settings">Back to Dashboared</a>
  </div>
</body>
</html>
    `);
  }

  // 🟢 Completed onboarding
  return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stripe Setup Successful</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #4625A0, #7c5cff);
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
      background: #4625A0;
      color: white;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: 0.2s ease;
    }
    .btn:hover { background: #361f85; transform: translateY(-1px); }
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
    <h1>Stripe Connected!</h1>
    <p class="subtitle">Your account has been successfully connected to Stripe.</p>
    <div class="info">
      <p><span>Account ID</span><strong>${stripeAccountId}</strong></p>
      <p><span>Status</span><span class="badge">COMPLETED</span></p>
    </div>
    <a class="btn" href="${config.client_Url}/vendor/settings">Go to Dashboard</a>
  </div>
</body>
</html>
  `);
});

const deleteAllRestricted = catchAsync(async (req: Request, res: Response) => {
  const result = await stripeService.deleteAllRestrictedTestAccounts();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Restricted accounts deleted',
    data: result,
  });
});

export const stripeController = {
  stripLinkAccount,
  refresh,
  returnUrl,
  deleteAllRestricted,
};
