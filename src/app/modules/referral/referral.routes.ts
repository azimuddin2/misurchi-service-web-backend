import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { ReferralControllers } from './referral.controller';

const router = express.Router();

router.get(
  '/referral-link',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  ReferralControllers.getReferralLink,
);

router.post(
  '/email',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  ReferralControllers.emailReferralLink,
);

router.get(
  '/stats',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  ReferralControllers.getReferralStats,
);

router.get(
  '/admin/all-vendors',
  auth(USER_ROLE.admin),
  ReferralControllers.getAllVendorReferralStats,
);

router.get(
  '/admin/vendor-detail/:vendorId',
  auth(USER_ROLE.admin),
  ReferralControllers.getVendorReferralDetail,
);

export const ReferralRoutes = router;
