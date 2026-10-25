import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TermsServices } from './terms.service';
import { Request, Response } from 'express';

const getTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsServices.getTermsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms retrieved successfully',
    data: result,
  });
});

const upsertTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsServices.upsertTermsIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms saved successfully',
    data: result,
  });
});

const deleteTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsServices.deleteTermsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms deleted successfully',
    data: result,
  });
});

export const TermsControllers = {
  getTerms,
  upsertTerms,
  deleteTerms,
};
