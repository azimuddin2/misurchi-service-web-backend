import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { TaxSummaryController } from './taxSummary.controller';

const router = express.Router();

router.get(
  '/sales',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryController.getSalesTaxSummary,
);

router.get(
  '/subscriptions',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryController.getSubscriptionTaxSummary,
);

router.get(
  '/sales/:year',
  auth(USER_ROLE.vendor, USER_ROLE.team_member),
  TaxSummaryController.getSalesTaxSummaryDetail,
);

export const TaxSummaryRoutes = router;
