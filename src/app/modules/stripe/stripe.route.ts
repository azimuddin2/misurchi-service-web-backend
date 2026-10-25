import { Router } from 'express';
import { stripeControllers } from './stripe.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.patch(
  '/connect-account',
  auth('vendor'),
  stripeControllers.stripLinkAccount,
);

router.get('/return', stripeControllers.returnUrl);

router.get('/refresh/:id', stripeControllers.refresh);

// Admin utility
router.delete(
  '/restricted/delete-all',
  auth('admin'),
  stripeControllers.deleteAllRestricted,
);

export const StripeRoute = router;
