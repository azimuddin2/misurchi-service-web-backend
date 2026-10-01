import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AboutService } from './about.service';

const getAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutService.getAboutFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info retrieved successfully',
    data: result,
  });
});

const upsertAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutService.upsertAboutIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info saved successfully',
    data: result,
  });
});

const deleteAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await AboutService.deleteAboutFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'About info deleted successfully',
    data: result,
  });
});

export const AboutController = {
  getAbout,
  upsertAbout,
  deleteAbout,
};
