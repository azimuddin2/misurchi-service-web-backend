import { model, Schema } from 'mongoose';
import { TReferralSettings } from './referralSettings.interface';

const ReferralSettingsSchema = new Schema<TReferralSettings>(
  {
    pointsPerReferral: {
      type: Number,
      required: [true, 'Referral points are required'],
      min: [1, 'Points must be at least 1'],
    },

    pointValue: {
      type: Number,
      required: [true, 'Point value is required'],
      min: [0, 'Point value cannot be negative'],
    },
  },
  { timestamps: true },
);

export const ReferralSettings = model<TReferralSettings>(
  'ReferralSettings',
  ReferralSettingsSchema,
);
