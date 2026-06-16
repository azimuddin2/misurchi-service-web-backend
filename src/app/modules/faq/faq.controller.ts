import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FAQService } from './faq.service';

const createFAQ = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQService.createFAQIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'FAQ created successfully',
    data: result,
  });
});

const getAllFAQ = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQService.getAllFAQFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result,
  });
});

const getAllFAQForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQService.getAllFAQForAdminFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result,
  });
});

const getFAQById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await FAQService.getFAQByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ retrieved successfully',
    data: result,
  });
});

const updateFAQ = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await FAQService.updateFAQIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ updated successfully',
    data: result,
  });
});

const updateFAQStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await FAQService.updateFAQStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ status updated successfully',
    data: result,
  });
});

export const FAQControllers = {
  createFAQ,
  getAllFAQ,
  getAllFAQForAdmin,
  getFAQById,
  updateFAQ,
  updateFAQStatus,
};
