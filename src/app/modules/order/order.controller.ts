import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderServices } from './order.service';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.createOrderIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product order successfully',
    data: result,
  });
});

const getAllOrderByUser = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrderByUserFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getOrdersByEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.query;
  const result = await OrderServices.getOrdersByEmailFromDB(email as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders fetched successfully',
    data: result,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.getOrderByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const requestOrder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.requestOrderIntoDB(
    id,
    req.body,
    req.files,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Request order successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderServices.updateOrderStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

const orderApprovedRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const vendorApproved = Boolean(req.body.vendorApproved);

  const updatedOrder = await OrderServices.orderApprovedRequestIntoDB(
    id,
    vendorApproved,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Request ${vendorApproved ? 'approved' : 'rejected'} successfully.`,
    data: updatedOrder,
  });
});

export const OrderControllers = {
  createOrder,
  getAllOrderByUser,
  getOrdersByEmail,
  getOrderById,
  requestOrder,
  updateOrderStatus,
  orderApprovedRequest,
};
