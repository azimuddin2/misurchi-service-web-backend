import mongoose, { Schema } from 'mongoose';
import { TCancellationPolicy } from './cancellationPolicy.interface';

const cancellationPolicySchema = new Schema<TCancellationPolicy>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },
    content: {
      type: String,
      required: [true, 'Cancellation Policy Description is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const CancellationPolicy = mongoose.model<TCancellationPolicy>(
  'CancellationPolicy',
  cancellationPolicySchema,
);
