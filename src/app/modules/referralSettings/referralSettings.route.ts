import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ReferralSettingsControllers } from './referralSettings.controller';
import { ReferralSettingsValidations } from './referralSettings.validation';

const router = express.Router();

router.get('/', ReferralSettingsControllers.getReferralSettings);

router.patch(
  '/',
  auth('admin'),
  validateRequest(
    ReferralSettingsValidations.updateReferralSettingsValidationSchema,
  ),
  ReferralSettingsControllers.updateReferralSettings,
);

export const ReferralSettingsRoutes = router;
