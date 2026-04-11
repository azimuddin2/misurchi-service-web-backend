import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VendorServices } from './vendor.service';

const getAllVendors = catchAsync(async (req: Request, res: Response) => {
  const result = await VendorServices.getAllVendorsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const result = await VendorServices.getVendorProfileFromDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const getVendorUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VendorServices.getVendorUserByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateVendorProfile = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;

  // Access files from multer
  const profileFile = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.['profile']?.[0];
  const coverFile = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.['coverImage']?.[0];

  const result = await VendorServices.updateVendorProfileIntoDB(
    email,
    req.body,
    profileFile,
    coverFile,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully.',
    data: result,
  });
});

const chooseOffer = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VendorServices.chooseOfferIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `Thanks! Your offer choice has been recorded successfully.`,
    data: result,
  });
});

const getVendorSummary = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await VendorServices.getVendorSummaryFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor summary data fetched successfully',
    data: result,
  });
});

const getVendorDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await VendorServices.getVendorDashboardStats(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Vendor Dashboard Stats retrieved successfully',
      data: result,
    });
  },
);

const getVendorSalesOverviewChart = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const result = await VendorServices.getVendorSalesOverviewChart(id, year);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Vendor yearly sales overview chart retrieved successfully',
      data: result,
    });
  },
);

const getAppointmentsOverviewRate = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { month } = req.query;

    const result = await VendorServices.getAppointmentsOverviewRate(
      id,
      month ? Number(month) : undefined,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        'Vendor monthly appointment completion rate retrieved successfully',
      data: result,
    });
  },
);

const getVendorDashboardData = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await VendorServices.getVendorDashboardDataFromDB(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Vendor dashboard data fetched successfully',
      data: result,
    });
  },
);

export const VendorControllers = {
  getAllVendors,
  getVendorProfile,
  getVendorUserById,
  updateVendorProfile,
  chooseOffer,
  getVendorSummary,
  getVendorDashboardStats,
  getVendorSalesOverviewChart,
  getAppointmentsOverviewRate,
  getVendorDashboardData,
};
