import { Router } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import { PaymentController } from './payment.controller';

const router = Router();

router.get('/', auth('vendor', 'team_member'), PaymentController.getAllPayment);

router.post('/checkout', auth(USER_ROLE.user), PaymentController.createPayment);

router.get('/confirm-payment', PaymentController.confirmPayment);

router.get('/cancel', PaymentController.cancelPayment);

router.get(
  '/admin-commission',
  auth('admin'),
  PaymentController.getAllPaymentByAdmin,
);

export const PaymentRoutes = router;
