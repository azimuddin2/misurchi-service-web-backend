import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TermsService } from './terms.service';
import { Request, Response } from 'express';

const getTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsService.getTermsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms retrieved successfully',
    data: result,
  });
});

const upsertTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsService.upsertTermsIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms saved successfully',
    data: result,
  });
});

const deleteTerms = catchAsync(async (req: Request, res: Response) => {
  const result = await TermsService.deleteTermsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Terms deleted successfully',
    data: result,
  });
});

export const TermsController = {
  getTerms,
  upsertTerms,
  deleteTerms,
};
