import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { StripeController } from './stripe.controller';

const router = express.Router();

// Vendor creates stripe connect account
router.post(
  '/vendor/create-account',
  auth(USER_ROLE.vendor),
  StripeController.createVendorAccount,
);

// Get vendor account status
router.post(
  '/vendor/account-status',
  auth(USER_ROLE.vendor),
  StripeController.getVendorAccountStatus,
);

export const StripeRoutes = router;
