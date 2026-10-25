import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { AboutValidation } from './about.validation';
import { AboutControllers } from './about.controller';

const router = express.Router();

router.get('/', AboutControllers.getAbout);

router.post(
  '/',
  auth('admin'),
  validateRequest(AboutValidation.createAboutValidationSchema),
  AboutControllers.upsertAbout,
);

router.delete('/', auth('admin'), AboutControllers.deleteAbout);

export const AboutRoutes = router;
