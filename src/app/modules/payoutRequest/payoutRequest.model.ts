import { Schema, model } from 'mongoose';
import { TPayoutRequest } from './payoutRequest.interface';

const payoutRequestSchema = new Schema<TPayoutRequest>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    vendorEmail: {
      type: String,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    availableBalance: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      default: 'Bank',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'rejected'],
      default: 'pending',
    },
    stripeTransferId: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const PayoutRequest = model<TPayoutRequest>(
  'PayoutRequest',
  payoutRequestSchema,
);
