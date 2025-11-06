import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PrivacyValidation } from './privacy.validation';
import { PrivacyController } from './privacy.controller';

const router = express.Router();

router.get('/', PrivacyController.getPrivacy);

router.post(
  '/',
  auth('admin'),
  validateRequest(PrivacyValidation.createPrivacyValidationSchema),
  PrivacyController.upsertPrivacy,
);

router.delete('/', auth('admin'), PrivacyController.deletePrivacy);

export const PrivacyRoutes = router;
