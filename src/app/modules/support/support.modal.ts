import { Schema, model } from 'mongoose';
import { TSupport } from './support.interface';

const supportSchema = new Schema<TSupport>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageReply: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    isHelpful: {
      type: Boolean,
      default: null,
    },
    follow: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Support = model<TSupport>('Support', supportSchema);
