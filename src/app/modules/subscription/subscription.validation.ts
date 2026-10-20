import { z } from 'zod';
import { DurationType, SubscriptionStatus } from './subscription.constant';

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    user: z
      .string({ required_error: 'User ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format'),

    plan: z
      .string({ required_error: 'Plan ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format'),

    durationType: z
      .enum([...DurationType] as [string, ...string[]])
      .default('monthly'),

    isPaid: z.boolean().default(false).optional(),

    amount: z
      .number({ required_error: 'Amount is required' })
      .positive('Amount must be greater than 0'),

    code: z.string().optional(),

    status: z
      .enum([...SubscriptionStatus] as [string, ...string[]])
      .default('pending')
      .optional(),

    startedAt: z
      .date()
      .optional()
      .default(() => new Date()),

    expiredAt: z.date({ required_error: 'Expiration date is required' }),

    isExpired: z.boolean().default(false).optional(),

    isDeleted: z.boolean().default(false).optional(),
  }),
});

const updateSubscriptionValidationSchema = z.object({
  body: z.object({
    durationType: z.enum([...DurationType] as [string, ...string[]]).optional(),
    isPaid: z.boolean().optional(),
    amount: z.number().positive().optional(),
    code: z.string().optional(),
    status: z.enum([...SubscriptionStatus] as [string, ...string[]]).optional(),
    startedAt: z.date().optional(),
    expiredAt: z.date().optional(),
    isExpired: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const SubscriptionValidations = {
  createSubscriptionValidationSchema,
  updateSubscriptionValidationSchema,
};
