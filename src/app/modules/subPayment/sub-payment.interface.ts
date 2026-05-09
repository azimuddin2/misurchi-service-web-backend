import { ObjectId } from 'mongoose';
import { TUser } from '../user/user.interface';
import { TSubscription } from '../subscription/subscription.interface';
import { TVendor } from '../vendor/vendor.interface';
import { TPlan } from '../plan/plan.interface';

export type TSubPayment = {
  _id: ObjectId;
  user: ObjectId | TUser;
  vendor: ObjectId | TVendor;
  plan: ObjectId | TPlan;
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
