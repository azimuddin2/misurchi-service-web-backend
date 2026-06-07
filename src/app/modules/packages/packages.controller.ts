import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PackagesServices } from './packages.service';

const createPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await PackagesServices.createPackagesIntoDB(
    req.body,
    req.files,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

const getAllPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await PackagesServices.getAllPackagesFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Services retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getAllPackagesByVendor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PackagesServices.getAllPackagesByVendorFromDB(
      req.query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Services retrieved successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

const getPackagesById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackagesServices.getPackagesByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

const updatePackages = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackagesServices.updatePackagesIntoDB(
    id,
    req.body,
    req.files,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

const deletePackages = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackagesServices.deletePackagesFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service deleted successfully',
    data: result,
  });
});

const updatePackagesStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PackagesServices.updatePackagesStatusIntoDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

const updatePackagesHighlightStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await PackagesServices.updatePackagesHighlightStatusIntoDB(
      id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Highlight status updated successfully.',
      data: result,
    });
  },
);

const getAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await PackagesServices.getAvailabilityFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Slots retrieved successfully',
    data: result,
  });
});

export const PackagesControllers = {
  createPackages,
  getAllPackages,
  getAllPackagesByVendor,
  getPackagesById,
  updatePackages,
  deletePackages,
  updatePackagesStatus,
  updatePackagesHighlightStatus,
  getAvailability,
};
