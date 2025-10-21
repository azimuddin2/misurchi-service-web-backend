import { z } from 'zod';

const createRecommendedTypeValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Recommended type is required',
    }),
  }),
});

const updateRecommendedTypeValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Recommended type is required',
      })
      .optional(),
  }),
});

export const RecommendedTypeValidation = {
  createRecommendedTypeValidationSchema,
  updateRecommendedTypeValidationSchema,
};
