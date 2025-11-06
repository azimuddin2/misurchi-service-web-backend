import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PolicyValidation } from './policy.validation';
import { PolicyController } from './policy.controller';

const router = express.Router();

router.get('/', PolicyController.getPolicy);

router.post(
  '/',
  auth('admin'),
  validateRequest(PolicyValidation.createPolicyValidationSchema),
  PolicyController.upsertPolicy,
);

router.delete('/', auth('admin'), PolicyController.deletePolicy);

export const PolicyRoutes = router;
