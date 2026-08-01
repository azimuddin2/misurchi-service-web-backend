import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ContactInfoControllers } from './contactInfo.controller';
import { ContactInfoValidations } from './contactInfo.validation';

const router = express.Router();

router.get('/', ContactInfoControllers.getContactInfo);

router.patch(
  '/',
  auth('admin'),
  validateRequest(ContactInfoValidations.updateContactInfoValidationSchema),
  ContactInfoControllers.updateContactInfo,
);

export const ContactInfoRoutes = router;
