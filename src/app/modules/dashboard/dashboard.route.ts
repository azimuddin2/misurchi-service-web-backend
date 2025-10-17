import { Router } from 'express';
import { DashboardControllers } from './dashboard.controller';

const router = Router();

router.get('/admin-stats', DashboardControllers.getAdminDashboardStats);

router.get('/vendor-stats/:id', DashboardControllers.getVendorDashboardStats);

router.get(
  '/vendor-sales-overview/:id',
  DashboardControllers.getVendorSalesOverviewChart,
);

export const DashboardRoutes = router;
