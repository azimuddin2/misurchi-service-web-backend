import { z } from 'zod';

const updateReferralSettingsValidationSchema = z.object({
  body: z.object({
    pointsPerReferral: z
      .number({
        required_error: 'Referral points are required',
      })
      .min(1, 'Points must be at least 1'),

    pointValue: z
      .number({
        required_error: 'Point value is required',
      })
      .min(0, 'Point value cannot be negative'),
  }),
});

export const ReferralSettingsValidations = {
  updateReferralSettingsValidationSchema,
};
