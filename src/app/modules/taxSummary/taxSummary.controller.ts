import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { TaxSummaryServices } from './taxSummary.service';

const getSalesTaxSummary = catchAsync(async (req: Request, res: Response) => {
  const { vendorId } = req.query;

  const result = await TaxSummaryServices.getSalesTaxSummaryFromDB(
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

    const result = await TaxSummaryServices.getSubscriptionTaxSummaryFromDB(
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

const getSalesTaxSummaryDetail = catchAsync(
  async (req: Request, res: Response) => {
    const { year } = req.params;
    const { vendorId } = req.query;

    const result = await TaxSummaryServices.getSalesTaxSummaryDetailFromDB(
      vendorId as string,
      Number(year),
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Tax summary detail fetched successfully',
      data: result,
    });
  },
);

export const TaxSummaryControllers = {
  getSalesTaxSummary,
  getSubscriptionTaxSummary,
  getSalesTaxSummaryDetail,
};
