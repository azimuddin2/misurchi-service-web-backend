import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';

const getAdminDashboardStats = catchAsync(async (req, res) => {
  const result = await DashboardService.getAdminDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin Dashboard Stats retrieved successfully',
    data: result,
  });
});

const getAdminUserOverviewChart = catchAsync(async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : undefined;

  const result = await DashboardService.getAdminUserOverviewChart(year);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin user yearly overview chart retrieved successfully',
    data: result,
  });
});

const getAdminEarningOverviewChart = catchAsync(async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : undefined;

  const result = await DashboardService.getAdminEarningOverviewChart(year);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin earning yearly overview chart retrieved successfully',
    data: result,
  });
});

const getVendorDashboardStats = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DashboardService.getVendorDashboardStats(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor Dashboard Stats retrieved successfully',
    data: result,
  });
});

const getVendorSalesOverviewChart = catchAsync(async (req, res) => {
  const { id } = req.params;
  const year = req.query.year ? Number(req.query.year) : undefined;

  const result = await DashboardService.getVendorSalesOverviewChart(id, year);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor yearly sales overview chart retrieved successfully',
    data: result,
  });
});

export const DashboardControllers = {
  getAdminDashboardStats,
  getAdminUserOverviewChart,
  getAdminEarningOverviewChart,
  getVendorDashboardStats,
  getVendorSalesOverviewChart,
};
