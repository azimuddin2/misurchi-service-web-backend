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

router.get(
  '/vendor-stats/:id',
  auth('vendor'),
  DashboardControllers.getVendorDashboardStats,
);

router.get(
  '/vendor-sales-overview/:id',
  auth('vendor'),
  DashboardControllers.getVendorSalesOverviewChart,
);

router.get(
  '/appointments-overview/:id',
  auth('vendor'),
  DashboardControllers.getAppointmentsOverviewRate,
);

export const DashboardRoutes = router;
