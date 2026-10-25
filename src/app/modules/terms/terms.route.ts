import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { TermsValidations } from './terms.validation';
import { TermsControllers } from './terms.controller';

const router = express.Router();

router.get('/', TermsControllers.getTerms);

router.post(
  '/',
  auth('admin'),
  validateRequest(TermsValidations.createTermsValidationSchema),
  TermsControllers.upsertTerms,
);

router.delete('/', auth('admin'), TermsControllers.deleteTerms);

export const TermsRoutes = router;
