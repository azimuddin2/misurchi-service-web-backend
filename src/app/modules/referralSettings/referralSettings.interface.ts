import { Types } from 'mongoose';

export type TReferralSettings = {
  _id?: Types.ObjectId;
  pointsPerReferral: number;
  pointValue: number;
  createdAt?: string;
  updatedAt?: string;
};
