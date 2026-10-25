import { z } from 'zod';

const createPolicyValidationSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: 'Policy content is required',
    }),
  }),
});

const updatePolicyValidationSchema = z.object({
  body: z.object({
    content: z
      .string({
        required_error: 'Policy content is required',
      })
      .optional(),
  }),
});

export const PolicyValidations = {
  createPolicyValidationSchema,
  updatePolicyValidationSchema,
};
