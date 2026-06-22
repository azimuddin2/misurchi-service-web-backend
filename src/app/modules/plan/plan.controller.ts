import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PlanServices } from './plan.service';

const createPlan = catchAsync(async (req: Request, res: Response) => {
  const result = await PlanServices.createPlanIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subscription Plan add successfully',
    data: result,
  });
});

const getAllPlans = catchAsync(async (req: Request, res: Response) => {
  const result = await PlanServices.getAllPlansFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getPlanById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlanServices.getPlanByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan retrieved successfully',
    data: result,
  });
});

const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlanServices.updatePlanIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Plan has been updated successfully.',
    data: result,
  });
});

const deletePlan = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PlanServices.deletePlanFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: result,
  });
});

export const PlanControllers = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
