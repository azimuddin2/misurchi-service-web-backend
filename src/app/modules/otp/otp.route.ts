import express from 'express';
import { OtpControllers } from './otp.controller';
import validateRequest from '../../middlewares/validateRequest';
import { OtpValidations } from './otp.validation';

const router = express.Router();

router.post('/resend-otp', OtpControllers.handleResendOtp);

router.post(
  '/verify-otp',
  validateRequest(OtpValidations.verifyOtpValidationSchema),
  OtpControllers.handleVerifyOtp,
);

export const OtpRoutes = router;
