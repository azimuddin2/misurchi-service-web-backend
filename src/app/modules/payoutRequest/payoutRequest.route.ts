import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { PayoutRequestControllers } from './payoutRequest.controller';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  PayoutRequestControllers.createPayoutRequest,
);

router.get(
  '/my-history',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  PayoutRequestControllers.getVendorPayoutHistory,
);

router.get(
  '/',
  auth(USER_ROLE.admin),
  PayoutRequestControllers.getAllPayoutRequests,
);

router.get(
  '/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestControllers.getPayoutRequestDetail,
);

router.patch(
  '/approve/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestControllers.approvePayoutRequest,
);

router.patch(
  '/reject/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestControllers.rejectPayoutRequest,
);

export const PayoutRequestRoutes = router;
