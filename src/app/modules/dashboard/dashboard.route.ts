import { Router } from 'express';
import { DashboardControllers } from './dashboard.controller';
import auth from '../../middlewares/auth';

const router = Router();

router.get(
  '/admin-stats',
  auth('admin'),
  DashboardControllers.getAdminDashboardStats,
);

router.get(
  '/admin-user-overview',
  auth('admin'),
  DashboardControllers.getAdminUserOverviewChart,
);

router.get(
  '/admin-earning-overview',
  auth('admin'),
  DashboardControllers.getAdminEarningOverviewChart,
);

export const DashboardRoutes = router;
