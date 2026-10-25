import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PrivacyValidations } from './privacy.validation';
import { PrivacyControllers } from './privacy.controller';

const router = express.Router();

router.get('/', PrivacyControllers.getPrivacy);

router.post(
  '/',
  auth('admin'),
  validateRequest(PrivacyValidations.createPrivacyValidationSchema),
  PrivacyControllers.upsertPrivacy,
);

router.delete('/', auth('admin'), PrivacyControllers.deletePrivacy);

export const PrivacyRoutes = router;
