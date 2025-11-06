import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { AboutValidation } from './about.validation';
import { AboutController } from './about.controller';

const router = express.Router();

router.get('/', AboutController.getAbout);

router.post(
  '/',
  auth('admin'),
  validateRequest(AboutValidation.createAboutValidationSchema),
  AboutController.upsertAbout,
);

router.delete('/', auth('admin'), AboutController.deleteAbout);

export const AboutRoutes = router;
