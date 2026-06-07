import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { TaxSummaryService } from './taxSummary.service';

const getSalesTaxSummary = catchAsync(async (req: Request, res: Response) => {
  const { vendorId } = req.query;

  const result = await TaxSummaryService.getSalesTaxSummaryFromDB(
    vendorId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sales tax summary fetched successfully',
    data: result,
  });
});

const getSubscriptionTaxSummary = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.query;

    const result = await TaxSummaryService.getSubscriptionTaxSummaryFromDB(
      vendorId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Subscription tax summary fetched successfully',
      data: result,
    });
  },
);

export const TaxSummaryController = {
  getSalesTaxSummary,
  getSubscriptionTaxSummary,
};
