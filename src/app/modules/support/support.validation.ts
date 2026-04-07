import { z } from 'zod';

const createSupportValidationSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(1, 'Last name cannot be empty'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    message: z
      .string({ required_error: 'Message is required' })
      .min(1, 'Message cannot be empty'),
    follow: z.boolean().default(true),
  }),
});

const replyAdminSupportValidationSchema = z.object({
  body: z.object({
    messageReply: z
      .string({ required_error: 'Reply message is required' })
      .min(1, 'Reply cannot be empty'),
    status: z.enum(['Pending', 'Reviewed', 'In Progress', 'Resolved'], {
      required_error: 'Status is required',
    }),
  }),
});

const helpfulSupportValidationSchema = z.object({
  body: z.object({
    isHelpful: z.boolean({
      required_error: 'isHelpful is required',
    }),
  }),
});

export const SupportValidation = {
  createSupportValidationSchema,
  replyAdminSupportValidationSchema,
  helpfulSupportValidationSchema,
};
