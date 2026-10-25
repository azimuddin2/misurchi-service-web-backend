import { z } from 'zod';

const createPrivacyValidationSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: 'Privacy content is required',
    }),
  }),
});

const updatePrivacyValidationSchema = z.object({
  body: z.object({
    content: z
      .string({
        required_error: 'Privacy content is required',
      })
      .optional(),
  }),
});

export const PrivacyValidations = {
  createPrivacyValidationSchema,
  updatePrivacyValidationSchema,
};
