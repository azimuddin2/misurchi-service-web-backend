import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PayoutRequestService } from './payoutRequest.service';
import { Types } from 'mongoose';

const createPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.user.vendorId as unknown as Types.ObjectId;

  const result = await PayoutRequestService.createPayoutRequest(vendorId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payout request created successfully',
    data: result,
  });
});

const getAllPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutRequestService.getAllPayoutRequests(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout requests fetched successfully',
    meta: result.meta,
    data: result.result,
  });
});

const approvePayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;

  const result = await PayoutRequestService.approvePayoutRequest(requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout request approved successfully',
    data: result,
  });
});

const rejectPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;

  const result = await PayoutRequestService.rejectPayoutRequest(requestId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payout request rejected successfully',
    data: result,
  });
});

const getPayoutRequestDetail = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId } = req.params;

    const result = await PayoutRequestService.getPayoutRequestDetail(requestId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Payout request detail fetched successfully',
      data: result,
    });
  },
);

const getVendorPayoutHistory = catchAsync(
  async (req: Request, res: Response) => {
    const vendorId = req.user.vendorId as unknown as Types.ObjectId;

    const result = await PayoutRequestService.getVendorPayoutHistory(vendorId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Payout history fetched successfully',
      data: result,
    });
  },
);

export const PayoutRequestController = {
  createPayoutRequest,
  getAllPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getPayoutRequestDetail,
  getVendorPayoutHistory,
};
