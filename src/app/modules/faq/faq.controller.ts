import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FAQServices } from './faq.service';

const createFAQ = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQServices.createFAQIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'FAQ created successfully',
    data: result,
  });
});

const getAllFAQ = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQServices.getAllFAQFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result,
  });
});

const getAllFAQForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await FAQServices.getAllFAQForAdminFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result,
  });
});

const getFAQById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await FAQServices.getFAQByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ retrieved successfully',
    data: result,
  });
});

const updateFAQ = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await FAQServices.updateFAQIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ updated successfully',
    data: result,
  });
});

const updateFAQStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { result, message } = await FAQServices.updateFAQStatusIntoDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message,
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
