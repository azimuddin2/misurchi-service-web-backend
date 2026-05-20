import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OtpServices } from './otp.service';

const handleResendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await OtpServices.resendOtpIntoDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP resent successfully.',
    data: result,
  });
});

const handleVerifyOtp = catchAsync(async (req, res) => {
  const token = req?.headers?.authorization as string;
  const otp = req.body.otp;

  const result = await OtpServices.verifyOtp(token, otp);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account verified successfully',
    data: result,
  });
});

export const OtpControllers = {
  handleResendOtp,
  handleVerifyOtp,
};
