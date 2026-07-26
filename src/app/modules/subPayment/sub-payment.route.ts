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

router.get('/cancel', SubPaymentsController.cancelPayment);

router.get('/', auth('admin'), SubPaymentsController.getAllSubPayment);

router.get(
  '/vendor',
  auth('vendor', 'team_member'),
  SubPaymentsController.getSubPaymentByVendor,
);

export const SubPaymentsRoutes = router;
