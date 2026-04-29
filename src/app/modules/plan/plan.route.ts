import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { PlanValidations } from './plan.validation';
import { PlanControllers } from './plan.controller';

const router = express.Router();

router.post(
  '/',
  auth('admin'),
  validateRequest(PlanValidations.createPlanValidationSchema),
  PlanControllers.createPlan,
);

router.get('/', PlanControllers.getAllPlans);

router.get(
  '/:id',
  auth('user', 'vendor', 'admin', 'team_member'),
  PlanControllers.getPlanById,
);

router.patch(
  '/:id',
  auth('admin'),
  validateRequest(PlanValidations.updatePlanValidationSchema),
  PlanControllers.updatePlan,
);

router.delete('/:id', auth('admin'), PlanControllers.deletePlan);

export const PlanRoutes = router;
