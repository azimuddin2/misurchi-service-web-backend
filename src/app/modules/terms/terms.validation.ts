import { z } from 'zod';

const createTermsValidationSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: 'Terms content is required',
    }),
  }),
});

const updateTermsValidationSchema = z.object({
  body: z.object({
    content: z
      .string({
        required_error: 'Terms content is required',
      })
      .optional(),
  }),
});

export const TermsValidations = {
  createTermsValidationSchema,
  updateTermsValidationSchema,
};
