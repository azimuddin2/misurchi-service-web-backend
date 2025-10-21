import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { RecommendedTypeValidation } from './recommendedType.validation';
import { RecommendedTypeControllers } from './recommendedType.controller';

const router = express.Router();

router.post(
  '/',
  auth('admin'),
  validateRequest(
    RecommendedTypeValidation.createRecommendedTypeValidationSchema,
  ),
  RecommendedTypeControllers.createRecommendedType,
);

router.get('/', RecommendedTypeControllers.getAllRecommendedType);

router.get('/:id', RecommendedTypeControllers.getRecommendedTypeById);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(
    RecommendedTypeValidation.updateRecommendedTypeValidationSchema,
  ),
  RecommendedTypeControllers.updateRecommendedType,
);

router.delete(
  '/:id',
  auth('admin'),
  RecommendedTypeControllers.deleteRecommendedType,
);

export const RecommendedTypeRoutes = router;
