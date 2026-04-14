import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { CancellationPolicyController } from './cancellationPolicy.controller';
import { CancellationPolicyValidation } from './cancellationPolicy.validation';

const router = express.Router();

router.patch(
  '/',
  auth('vendor'),
  validateRequest(
    CancellationPolicyValidation.createCancellationPolicyValidationSchema,
  ),
  CancellationPolicyController.upsertCancellationPolicy,
);

router.get(
  '/:vendorId',
  auth('user', 'vendor', 'admin'),
  CancellationPolicyController.getCancellationPolicy,
);

export const CancellationPolicyRoutes = router;
