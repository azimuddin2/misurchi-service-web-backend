// import express from 'express';
// import auth from '../../middlewares/auth';
// import { USER_ROLE } from '../user/user.constant';
// import { ReferralController } from './referral.controller';

// const router = express.Router();

// // Vendor only routes
// router.get(
//   '/referral-link',
//   auth(USER_ROLE.vendor),
//   ReferralController.getReferralLink,
// );

// router.post(
//   '/referral/email',
//   auth(USER_ROLE.vendor),
//   ReferralController.emailReferralLink,
// );

// router.get(
//   '/referral/stats',
//   auth(USER_ROLE.vendor),
//   ReferralController.getReferralStats,
// );

// export const ReferralRoutes = router;