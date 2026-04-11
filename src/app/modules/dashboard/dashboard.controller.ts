import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';

const getAdminDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DashboardService.getAdminDashboardStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Admin Dashboard Stats retrieved successfully',
      data: result,
    });
  },
);

const getAdminUserOverviewChart = catchAsync(
  async (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;

    const result = await DashboardService.getAdminUserOverviewChart(year);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Admin user yearly overview chart retrieved successfully',
      data: result,
    });
  },
);

const getAdminEarningOverviewChart = catchAsync(
  async (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;

    const result = await DashboardService.getAdminEarningOverviewChart(year);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Admin earning yearly overview chart retrieved successfully',
      data: result,
    });
  },
);

export const DashboardControllers = {
  getAdminDashboardStats,
  getAdminUserOverviewChart,
  getAdminEarningOverviewChart,
};
