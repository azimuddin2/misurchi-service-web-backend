import { Router } from 'express';
import auth from '../../middlewares/auth';
import { SubscriptionControllers } from './subscription.controller';
const router = Router();

router.post(
  '/create-subscription',
  auth('vendor'),
  SubscriptionControllers.createSubscription,
);

router.get(
  '/vendor/active/:vendorId',
  auth('vendor', 'team_member'),
  SubscriptionControllers.getActiveSubscriptionByVendor,
);

router.get(
  '/vendor/status/:vendorId',
  auth('vendor', 'team_member'),
  SubscriptionControllers.getVendorSubscriptionStatus,
);

router.patch(
  '/cancel-subscription/:vendorId',
  auth('vendor'),
  SubscriptionControllers.cancelActiveSubscription,
);

router.patch(
  '/resume-subscription/:vendorId',
  auth('vendor'),
  SubscriptionControllers.resumeSubscription,
);

export const SubscriptionRoutes = router;
