import { Schema, model } from 'mongoose';
import { TReferral } from './referral.interface';

const referralSchema = new Schema<TReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    businessName: {
      type: String,
      default: 'Unknown Business',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    pointsAwarded: {
      type: Number,
      default: 1,
    },
    pointValueAtCompletion: {
      type: Number,
    },
    rewardValue: {
      type: Number,
      default: 0,
    },
    paidOut: {
      type: Boolean,
      default: false,
    },
    payoutRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PayoutRequest',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Referral = model<TReferral>('Referral', referralSchema);
