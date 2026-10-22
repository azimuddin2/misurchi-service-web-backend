import { Types } from 'mongoose';

export type TPayoutRequestStatus =
  'pending' | 'processing' | 'approved' | 'rejected';

export type TPayoutRequest = {
  vendorId: Types.ObjectId;
  vendorName: string;
  vendorEmail: string;
  totalPoints: number;
  availableBalance: number;
  method: string;
  status: TPayoutRequestStatus;
  referralIds?: Types.ObjectId[];
  stripeTransferId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  requestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
