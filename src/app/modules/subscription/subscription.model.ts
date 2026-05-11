import { Schema, model } from 'mongoose';
import { TSubscription, TSubscriptionModel } from './subscription.interface';
import { SubscriptionStatus } from './subscription.constant';

const subscriptionSchema = new Schema<TSubscription, TSubscriptionModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    durationType: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    code: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: SubscriptionStatus,
        message: '{VALUE} is not valid',
      },
      default: 'pending',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

subscriptionSchema.index({ user: 1, isDeleted: 1 });

export const Subscription = model<TSubscription, TSubscriptionModel>(
  'Subscription',
  subscriptionSchema,
);
