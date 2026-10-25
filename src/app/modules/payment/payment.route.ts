import { Router } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { PaymentControllers } from './payment.controller';

const router = Router();

router.get(
  '/',
  auth('vendor', 'team_member'),
  PaymentControllers.getAllPayment,
);

router.post(
  '/checkout',
  auth(USER_ROLE.user),
  PaymentControllers.createPayment,
);

router.get('/confirm-payment', PaymentControllers.confirmPayment);

router.get('/cancel', PaymentControllers.cancelPayment);

router.get(
  '/admin-commission',
  auth('admin'),
  PaymentControllers.getAllPaymentByAdmin,
);

export const PaymentRoutes = router;
