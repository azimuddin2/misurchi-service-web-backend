import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { TaxSummaryController } from './taxSummary.controller';

const router = express.Router();

router.get(
  '/sales',
  auth(USER_ROLE.vendor),
  TaxSummaryController.getSalesTaxSummary,
);

router.get(
  '/subscriptions',
  auth(USER_ROLE.vendor),
  TaxSummaryController.getSubscriptionTaxSummary,
);

export const TaxSummaryRoutes = router;
