import { Notification } from './notification.model';
import httpStatus from 'http-status';
import moment from 'moment';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { ModeType } from './notification.interface';
import { ObjectId } from 'mongoose';
import { User } from '../user/user.model';
import { USER_ROLE } from '../user/user.constant';

const insertNotificationIntoDB = async (payload: any) => {
  const payloadArray = Array.isArray(payload) ? payload : [payload];
  const result = await Notification.insertMany(payloadArray);

  if (!result || result.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Notification created failed');
  }

  //@ts-ignore
  const io = global.socketio;
  if (io) {
    result.forEach((notification) => {
      const ver = 'notification::' + notification.receiver;
      io.emit(ver, {
        ...notification.toObject(),
        createdAt: moment().format('YYYY-MM-DD'),
      });
    });
  }

  return result;
};

const notifyAdmins = async (
  message: string,
  reference: string | ObjectId,
  model_type: ModeType,
  description?: string,
) => {
  const admins = await User.find({
    role: { $in: [USER_ROLE.admin] },
  }).select('_id');

  if (!admins.length) return;

  const payload = admins.map((admin) => ({
    receiver: admin._id,
    message,
    description,
    reference,
    model_type,
    read: false,
  }));

  return insertNotificationIntoDB(payload);
};

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

const deleteNotificationFromDB = async (id: string) => {
  const result = await Notification.deleteMany({ receiver: id });
  return result;
};

export const NotificationServices = {
  insertNotificationIntoDB,
  notifyAdmins,
  getAllNotificationsFromDB,
  getNotificationByIdFromDB,
  markAsDone,
  deleteNotificationFromDB,
};
