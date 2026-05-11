import { Types } from 'mongoose';

export type TReferralStatus = 'pending' | 'completed';

export type TReferral = {
  referrerId: Types.ObjectId; // যে vendor refer করেছে
  referredUserId: Types.ObjectId; // যাকে refer করা হয়েছে
  businessName: string; // referee এর business name
  status: TReferralStatus;
  pointsAwarded: number; // default 1
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
