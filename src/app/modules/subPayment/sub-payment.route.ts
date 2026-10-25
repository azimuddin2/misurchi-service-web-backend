import { Router } from 'express';
import { SubPaymentsControllers } from './sub-payment.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.post(
  '/sub-checkout',
  auth('vendor'),
  SubPaymentsControllers.subPayCheckout,
);

router.get('/confirm-sub-payment', SubPaymentsControllers.confirmPayment);

router.post('/webhook', SubPaymentsControllers.webhook);

router.get('/cancel', SubPaymentsControllers.cancelPayment);

router.get('/', auth('admin'), SubPaymentsControllers.getAllSubPayment);

router.get(
  '/vendor',
  auth('vendor', 'team_member'),
  SubPaymentsControllers.getSubPaymentByVendor,
);

export const SubPaymentsRoutes = router;
