import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { SupportValidation } from './support.validation';
import { SupportControllers } from './support.controller';

const router = express.Router();

router.post(
  '/',
  validateRequest(SupportValidation.createSupportValidationSchema),
  SupportControllers.createSupport,
);

router.get('/', auth('admin'), SupportControllers.getAllSupport);

router.get(
  '/:email',
  auth('user', 'vendor'),
  SupportControllers.getSupportByEmail,
);

router.get('/:id', auth('admin'), SupportControllers.getSupportById);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(SupportValidation.replyAdminSupportValidationSchema),
  SupportControllers.updateSupport,
);

router.patch(
  '/:id/helpful',
  auth('user', 'vendor'),
  validateRequest(SupportValidation.helpfulSupportValidationSchema),
  SupportControllers.supportMarkHelpful,
);

router.delete('/:id', auth('admin'), SupportControllers.deleteSupport);

export const SupportRoutes = router;
