import { Types } from 'mongoose';

export type TReferralStatus = 'pending' | 'completed';

export type TReferral = {
  referrerId: Types.ObjectId; // The vendor who referred the user
  referredUserId: Types.ObjectId; // The user who was referred
  businessName: string;
  status: TReferralStatus;
  pointsAwarded: number;
  pointValueAtCompletion?: number;
  rewardValue?: number;
  paidOut?: boolean;
  payoutRequestId?: Types.ObjectId;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
