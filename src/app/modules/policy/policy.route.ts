import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PolicyValidations } from './policy.validation';
import { PolicyControllers } from './policy.controller';

const router = express.Router();

router.get('/', PolicyControllers.getPolicy);

router.post(
  '/',
  auth('admin'),
  validateRequest(PolicyValidations.createPolicyValidationSchema),
  PolicyControllers.upsertPolicy,
);

router.delete('/', auth('admin'), PolicyControllers.deletePolicy);

export const PolicyRoutes = router;
