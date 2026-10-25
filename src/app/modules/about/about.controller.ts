import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AboutServices } from './about.service';

const getAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutServices.getAboutFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info retrieved successfully',
    data: result,
  });
});

const upsertAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutServices.upsertAboutIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info saved successfully',
    data: result,
  });
});

const deleteAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutServices.deleteAboutFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info deleted successfully',
    data: result,
  });
});

export const AboutControllers = {
  getAbout,
  upsertAbout,
  deleteAbout,
};
