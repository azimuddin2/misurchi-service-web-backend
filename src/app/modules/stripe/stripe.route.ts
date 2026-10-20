import { Router } from 'express';
import { stripeController } from './stripe.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.patch(
  '/connect-account',
  auth('vendor'),
  stripeController.stripLinkAccount,
);

router.get('/return', stripeController.returnUrl);

router.get('/refresh/:id', stripeController.refresh);

// Admin utility
router.delete(
  '/restricted/delete-all',
  auth('admin'),
  stripeController.deleteAllRestricted,
);

export const StripeRoute = router;
