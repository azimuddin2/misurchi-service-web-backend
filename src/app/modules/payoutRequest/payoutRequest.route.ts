import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { PayoutRequestController } from './payoutRequest.controller';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLE.vendor),
  PayoutRequestController.createPayoutRequest,
);

router.get(
  '/my-history',
  auth(USER_ROLE.vendor),
  PayoutRequestController.getVendorPayoutHistory,
);

router.get(
  '/',
  auth(USER_ROLE.admin),
  PayoutRequestController.getAllPayoutRequests,
);

router.get(
  '/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestController.getPayoutRequestDetail,
);

router.patch(
  '/approve/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestController.approvePayoutRequest,
);

router.patch(
  '/reject/:requestId',
  auth(USER_ROLE.admin),
  PayoutRequestController.rejectPayoutRequest,
);

export const PayoutRequestRoutes = router;
