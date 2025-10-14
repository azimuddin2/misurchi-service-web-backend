import { Router } from 'express';
import { SubPaymentsController } from './sub-payment.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.post(
  '/sub-checkout',
  auth('vendor'),
  SubPaymentsController.subPayCheckout,
);

router.get('/confirm-sub-payment', SubPaymentsController.confirmPayment);

router.post('/webhook', SubPaymentsController.webhook);

// router.get(
//   '/dashboard-data',
//   // auth(USER_ROLE.admin),
//   SubPaymentsController.dashboardData,
// );

// router.get(
//   '/earnings',
//   // auth(USER_ROLE.admin),
//   SubPaymentsController.getEarnings,
// );

// router.get('/dashboard-data', SubPaymentsController.);

export const SubPaymentsRoutes = router;
