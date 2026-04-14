import { z } from 'zod';

const createReturnPolicyValidationSchema = z.object({
  body: z.object({
    vendor: z.string({
      required_error: 'Vendor Id is required',
    }),

    content: z
      .string({
        required_error: 'Return Policy content is required',
      })
      .optional(),
  }),
});

export const ReturnPolicyValidation = {
  createReturnPolicyValidationSchema,
};
