import { Schema, model } from 'mongoose';
import { TPlan } from './plan.interface';
import { ValidityType } from './plan.constant';

const planSchema = new Schema<TPlan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User Id is required'],
      ref: 'User',
    },
    name: { type: String, required: true, unique: true },
    cost: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },

    features: {
      teamMembers: { type: Boolean, default: false },
      sharedCalendar: { type: Boolean, default: false },
      taskHub: { type: Boolean, default: false },
      grantPermissionAccess: { type: Boolean, default: false },
    },

    limits: {
      serviceMax: { type: String, default: 0 },
      productMax: { type: String, default: 0 },
      highlightOfferMax: { type: Number, default: 0 },
      transactionFee: { type: Number, default: 0 },
    },

    validity: {
      type: String,
      enum: {
        values: ValidityType,
        message: '{VALUE} is not valid',
      },
      default: '1month',
    },

    // Stripe fields
    stripeProductId: { type: String },
    stripePriceId: { type: String },

    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Plan = model<TPlan>('Plan', planSchema);
