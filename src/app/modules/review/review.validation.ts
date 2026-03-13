import { z } from 'zod';
import { Types } from 'mongoose';

// Custom ObjectId validator
const objectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid MongoDB ObjectId',
  })
  .transform((val) => new Types.ObjectId(val));

export const createReviewValidationSchema = z.object({
  body: z
    .object({
      user: objectId,
      product: objectId.optional(),
      service: objectId.optional(),
      review: z
        .string({ required_error: 'Review is required' })
        .min(12, 'Review must be at least 12 characters long'),
      rating: z
        .number({ required_error: 'Rating is required' })
        .min(1, 'Please select at least 1 star rating')
        .max(5, 'Rating must be at most 5 stars rating'),
    })
    .refine((data) => data.product || data.service, {
      message: 'Either product or service must be provided',
      path: ['product'],
    })
    .refine((data) => !(data.product && data.service), {
      message: 'Provide either product or service, not both',
      path: ['service'],
    }),
});

export const ReviewValidation = {
  createReviewValidationSchema,
};
