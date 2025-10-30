// src/modules/stripe/stripe.model.ts
import { Schema, model } from 'mongoose';
import { IVendorStripeAccount } from './stripe.interface';

const vendorStripeAccountSchema = new Schema<IVendorStripeAccount>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'restricted'],
      default: 'pending',
    },
    detailsSubmitted: {
      type: Boolean,
      default: false,
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const VendorStripeAccount = model<IVendorStripeAccount>(
  'VendorStripeAccount',
  vendorStripeAccountSchema,
);
