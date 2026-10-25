import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { CancellationPolicyControllers } from './cancellationPolicy.controller';
import { CancellationPolicyValidations } from './cancellationPolicy.validation';

const router = express.Router();

router.patch(
  '/',
  auth('vendor', 'team_member'),
  validateRequest(
    CancellationPolicyValidations.createCancellationPolicyValidationSchema,
  ),
  CancellationPolicyControllers.upsertCancellationPolicy,
);

router.get(
  '/:vendorId',
  auth('user', 'vendor', 'team_member', 'admin'),
  CancellationPolicyControllers.getCancellationPolicy,
);

export const CancellationPolicyRoutes = router;
