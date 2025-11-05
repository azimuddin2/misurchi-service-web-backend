import { Notification } from './notification.model';
import httpStatus from 'http-status';
import moment from 'moment';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';

// Insert notifications into the database
const insertNotificationIntoDB = async (payload: any) => {
  const result = await Notification.insertMany(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Notification created failed');
  }
  //@ts-ignore
  const io = global.socketio;
  if (io) {
    const ver = 'notification::' + payload?.receiver;
    io.emit(ver, { ...payload, createdAt: moment().format('YYYY-MM-DD') });
  }

  return result;
};

// Get all notifications
const getAllNotificationsFromDB = async (query: Record<string, any>) => {
  const notificationQuery = new QueryBuilder(Notification.find(), query)
    .search([])
    .filter()
    .paginate()
    .sort()
    .fields();

  const meta = await notificationQuery.countTotal();
  const data = await notificationQuery.modelQuery;

  return {
    data,
    meta,
  };
};

// Get single notification by ID
const getNotificationByIdFromDB = async (id: string) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { $set: { read: true } },
    { new: true },
  );

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return notification;
};

// Mark notifications as read
const markAsDone = async (id: string) => {
  const result = await Notification.updateMany(
    { receiver: id },
    {
      $set: {
        read: true,
      },
    },
    { new: true },
  );
  return result;
};

// Delete many notification
const deleteNotificationFromDB = async (id: string) => {
  const result = await Notification.deleteMany({ receiver: id });
  return result;
};

export const NotificationServices = {
  insertNotificationIntoDB,
  getAllNotificationsFromDB,
  getNotificationByIdFromDB,
  markAsDone,
  deleteNotificationFromDB,
};
