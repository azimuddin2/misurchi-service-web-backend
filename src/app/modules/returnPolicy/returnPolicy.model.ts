import mongoose, { Schema } from 'mongoose';
import { TReturnPolicy } from './returnPolicy.interfact';

const returnPolicySchema = new Schema<TReturnPolicy>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },
    content: {
      type: String,
      required: [true, 'Return Policy Description is required'],
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

export const ReturnPolicy = mongoose.model<TReturnPolicy>(
  'ReturnPolicy',
  returnPolicySchema,
);
