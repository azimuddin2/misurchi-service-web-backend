import { Document, Types } from 'mongoose';

export interface IVendorStripeAccount extends Document {
  vendor: Types.ObjectId;
  stripeAccountId: string;
  email: string;
  status: 'pending' | 'verified' | 'restricted';
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
