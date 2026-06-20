import { Types } from 'mongoose';
import { TVendor } from '../vendor/vendor.interface';

export type TPayoutStatus = 'pending' | 'approved' | 'rejected';

export type TPayoutRequest = {
  vendorId: Types.ObjectId | TVendor;
  vendorName: string;
  vendorEmail: string;
  totalPoints: number;
  availableBalance: number;
  method: string; // "Stripe"
  status: TPayoutStatus;
  requestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
