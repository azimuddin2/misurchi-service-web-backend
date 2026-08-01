import { z } from 'zod';

const updateContactInfoValidationSchema = z.object({
  body: z.object({
    phone: z
      .string({
        required_error: 'Phone number is required',
      })
      .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Please enter a valid email'),
  }),
});

export const ContactInfoValidations = {
  updateContactInfoValidationSchema,
};
