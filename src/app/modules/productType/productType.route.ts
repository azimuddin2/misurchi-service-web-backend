import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ProductTypeValidations } from './productType.validation';
import { ProductTypeControllers } from './productType.controller';

const router = express.Router();

router.post(
  '/',
  auth('admin'),
  validateRequest(ProductTypeValidations.createProductTypeValidationSchema),
  ProductTypeControllers.createProductType,
);

router.get('/', ProductTypeControllers.getAllProductType);

router.get('/:id', ProductTypeControllers.getProductTypeById);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(ProductTypeValidations.updateProductTypeValidationSchema),
  ProductTypeControllers.updateProductType,
);

router.delete('/:id', auth('admin'), ProductTypeControllers.deleteProductType);

export const ProductTypeRoutes = router;
