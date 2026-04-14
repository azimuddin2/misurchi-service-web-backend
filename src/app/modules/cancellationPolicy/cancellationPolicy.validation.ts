import { z } from 'zod';

const createCancellationPolicyValidationSchema = z.object({
  body: z.object({
    vendor: z.string({
      required_error: 'Vendor Id is required',
    }),

    content: z
      .string({
        required_error: 'Cancellation Policy content is required',
      })
      .optional(),
  }),
});

export const CancellationPolicyValidation = {
  createCancellationPolicyValidationSchema,
};
