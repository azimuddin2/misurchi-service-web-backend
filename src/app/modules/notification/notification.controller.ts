import { Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { NotificationServices } from './notification.service';

const insertNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.insertNotificationIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification added successfully',
    data: result,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const query = { ...req.query };

  // Use userId from query if provided, otherwise fallback to logged-in user
  query['receiver'] = req.query.receiver;

  const result = await NotificationServices.getAllNotificationsFromDB(query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result?.data,
    meta: result?.meta,
  });
});

const getNotificationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NotificationServices.getNotificationByIdFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification retrieved successfully',
    data: result,
  });
});

const markAsDone = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.markAsDone(req?.user?.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read successfully',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationServices.deleteNotificationFromDB(
    req?.user?.userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: result,
  });
});

export const notificationControllers = {
  insertNotification,
  getAllNotifications,
  getNotificationById,
  markAsDone,
  deleteNotification,
};
