import { Types } from 'mongoose';

export type TReferralStatus = 'pending' | 'completed';

export type TReferral = {
  referrerId: Types.ObjectId; // যে vendor refer করেছে
  referredUserId: Types.ObjectId; // যাকে refer করা হয়েছে
  businessName: string;
  status: TReferralStatus;
  pointsAwarded: number;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
