import { Request, Response } from 'express';
import config from '../../config';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';
import { getRefreshCookieName } from '../../utils/getRefreshCookieName';

const handleLoginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  const { accessToken, refreshToken } = result;
  const cookieName = getRefreshCookieName(req);

  res.cookie(cookieName, refreshToken, {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User is logged in successfully!',
    data: { accessToken },
  });
});

const handleRefreshToken = catchAsync(async (req: Request, res: Response) => {
  const cookieName = getRefreshCookieName(req);
  const refreshToken = req.cookies[cookieName];

  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token is retrieved successfully!',
    data: result,
  });
});

const handleChangePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.changePassword(req.user, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password is updated successfully!',
    data: result,
  });
});

const handleForgotPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AuthServices.forgotPassword(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'An OTP has been sent to your email address.',
    data: result,
  });
});

const handleResetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.authorization as string;
  const result = await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Your password has been updated successfully.',
    data: result,
  });
});

const handleGoogleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.googleLogin(req.body);

  const { user, accessToken, refreshToken } = result;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in with Google successfully!',
    data: { user, accessToken, refreshToken },
  });
});

export const AuthControllers = {
  handleLoginUser,
  handleRefreshToken,
  handleChangePassword,
  handleForgotPassword,
  handleResetPassword,
  handleGoogleLogin,
};
