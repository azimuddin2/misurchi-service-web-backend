import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { ReferralController } from './referral.controller';

const router = express.Router();

router.get(
  '/referral-link',
  auth(USER_ROLE.vendor),
  ReferralController.getReferralLink,
);

router.post(
  '/email',
  auth(USER_ROLE.vendor),
  ReferralController.emailReferralLink,
);

router.get(
  '/stats',
  auth(USER_ROLE.vendor),
  ReferralController.getReferralStats,
);

router.get(
  '/admin/all-vendors',
  auth(USER_ROLE.admin),
  ReferralController.getAllVendorReferralStats,
);

router.get(
  '/admin/vendor-detail/:vendorId',
  auth(USER_ROLE.admin),
  ReferralController.getVendorReferralDetail,
);

export const ReferralRoutes = router;
