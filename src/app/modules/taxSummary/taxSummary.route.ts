import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { TaxSummaryControllers } from './taxSummary.controller';

const router = express.Router();

router.get(
  '/sales',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryControllers.getSalesTaxSummary,
);

router.get(
  '/subscriptions',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryControllers.getSubscriptionTaxSummary,
);

router.get(
  '/sales/:year',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryControllers.getSalesTaxSummaryDetail,
);

export const TaxSummaryRoutes = router;
