import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ServiceTypeServices } from './serviceType.service';

const createServiceType = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceTypeServices.createServiceTypeIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service type add successfully',
    data: result,
  });
});

const getAllServiceType = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceTypeServices.getAllServiceTypeFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service type retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getServiceTypeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceTypeServices.getServiceTypeByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service type retrieved successfully',
    data: result,
  });
});

const updateServiceType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceTypeServices.updateServiceTypeIntoDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service type has been updated successfully.',
    data: result,
  });
});

const deleteServiceType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ServiceTypeServices.deleteServiceTypeFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Service type deleted successfully',
    data: result,
  });
});

export const ServiceTypeControllers = {
  createServiceType,
  getAllServiceType,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};
