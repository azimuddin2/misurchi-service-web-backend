import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ServiceTypeValidations } from './serviceType.validation';
import { ServiceTypeControllers } from './serviceType.controller';

const router = express.Router();

router.post(
  '/',
  auth('admin'),
  validateRequest(ServiceTypeValidations.createServiceTypeValidationSchema),
  ServiceTypeControllers.createServiceType,
);

router.get('/', ServiceTypeControllers.getAllServiceType);

router.get('/:id', ServiceTypeControllers.getServiceTypeById);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(ServiceTypeValidations.updateServiceTypeValidationSchema),
  ServiceTypeControllers.updateServiceType,
);

router.delete('/:id', auth('admin'), ServiceTypeControllers.deleteServiceType);

export const ServiceTypeRoutes = router;
