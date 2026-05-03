import { Model, ObjectId } from 'mongoose';
import { TUser } from '../user/user.interface';
import { TSubscription } from '../subscription/subscription.interface';
import { TVendor } from '../vendor/vendor.interface';

export type TSubPayment = {
  _id: ObjectId;
  user: ObjectId | TUser;
  vendor: ObjectId | TVendor;
  plan: ObjectId;
  subscription?: ObjectId | TSubscription;
  durationType: 'monthly' | 'yearly';
  amount: number;
  tranId: string;
  isPaid: boolean;
  paidAt: Date;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ISubscriptionsModel = Model<TSubPayment, Record<string, unknown>>;
