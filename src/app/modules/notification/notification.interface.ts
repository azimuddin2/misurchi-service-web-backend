import { ObjectId } from 'mongodb';

export enum ModeType {
  Booking = 'Booking',
  Order = 'Order',
  Payment = 'Payment',
  Support = 'Support',
  SubscriptionPayment = 'SubscriptionPayment',
  ReferralRequest = 'ReferralRequest',
  Message = 'Message',
  Task = 'Task',
}

export type TNotification = {
  receiver: ObjectId;
  message: string;
  description?: string;
  reference: ObjectId;
  model_type: ModeType;
  date?: Date;
  read: boolean;
  isDeleted: boolean;
};
