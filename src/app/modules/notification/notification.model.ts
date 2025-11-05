import { Schema, model } from 'mongoose';
import { ModeType, TNotification } from './notification.interface';

const notificationSchema = new Schema<TNotification>(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver id is required'],
    },
    reference: {
      type: Schema.Types.ObjectId,
      //   dynamic reference
      refPath: 'model_type',
      required: [true, 'Receiver id is required'],
    },
    model_type: {
      type: String,
      enum: Object.values(ModeType),
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    description: {
      type: String,
      default: '',
    },
    read: {
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

// filter out deleted documents
notificationSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

notificationSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

notificationSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const Notification = model<TNotification>(
  'Notification',
  notificationSchema,
);
