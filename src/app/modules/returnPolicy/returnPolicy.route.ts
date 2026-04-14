import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ReturnPolicyValidation } from './returnPolicy.validation';
import { ReturnPolicyController } from './returnPolicy.controller';

const router = express.Router();

router.post(
  '/',
  auth('vendor'),
  validateRequest(ReturnPolicyValidation.createReturnPolicyValidationSchema),
  ReturnPolicyController.upsertReturnPolicy,
);

router.get(
  '/:vendorId',
  auth('user', 'vendor', 'admin'),
  ReturnPolicyController.getReturnPolicy,
);

export const ReturnPolicyRoutes = router;
