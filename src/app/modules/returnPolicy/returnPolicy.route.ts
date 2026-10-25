import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ReturnPolicyValidations } from './returnPolicy.validation';
import { ReturnPolicyControllers } from './returnPolicy.controller';

const router = express.Router();

router.post(
  '/',
  auth('vendor', 'team_member'),
  validateRequest(ReturnPolicyValidations.createReturnPolicyValidationSchema),
  ReturnPolicyControllers.upsertReturnPolicy,
);

router.get(
  '/:vendorId',
  auth('user', 'vendor', 'team_member', 'admin'),
  ReturnPolicyControllers.getReturnPolicy,
);

export const ReturnPolicyRoutes = router;
