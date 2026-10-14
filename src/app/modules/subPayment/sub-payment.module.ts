import { model, Schema } from 'mongoose';
import { TSubPayment } from './sub-payment.interface';

const SubPaymentSchema = new Schema<TSubPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    subscriptionType: {
      type: String,
      enum: ['advance', 'basic'],
      default: null,
    },
    durationType: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tranId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

SubPaymentSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

SubPaymentSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

SubPaymentSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export const SubPayment = model<TSubPayment>('SubPayment', SubPaymentSchema);
