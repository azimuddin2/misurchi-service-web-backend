import { z } from 'zod';
import { BookingStatus } from './booking.constant';

const BookingRequestSchemaZod = z.object({
  type: z.enum(['none', 'cancel', 'reschedule']).optional().default('none'),
  reason: z.string().optional(),
  newDate: z.string().optional(),
  newTime: z.string().optional(),
  vendorApproved: z.boolean().optional().default(false),
  updatedAt: z.date().optional(),
});

const createBookingValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Full name is required' })
      .min(3, 'Full name must be at least 3 characters'),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),

    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(1, 'Phone number is required')
      .regex(/^\+?\d+$/, 'Phone number must contain only digits'),

    serviceName: z
      .string({ required_error: 'Service name is required' })
      .min(1, 'Service name is required'),

    duration: z
      .string({ required_error: 'Duration is required' })
      .min(1, 'Duration is required'),

    price: z
      .number({ required_error: 'Price is required' })
      .positive('Price must be a positive number')
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: 'Price can have at most 2 decimal places',
      }),

    date: z
      .string({ required_error: 'Date is required' })
      .min(1, 'Date is required'),

    time: z
      .string({ required_error: 'Time is required' })
      .min(1, 'Time is required'),

    // Optional booking request field
    request: BookingRequestSchemaZod.optional(),
  }),
});

const updateBookingValidationSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Full name is required' })
      .min(3, 'Full name must be at least 3 characters')
      .optional(),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .optional(),

    phone: z
      .string({ required_error: 'Phone number is required' })
      .min(1, 'Phone number is required')
      .regex(/^\+?\d+$/, 'Phone number must contain only digits')
      .optional(),

    serviceName: z
      .string({ required_error: 'Service name is required' })
      .min(1, 'Service name is required')
      .optional(),

    duration: z
      .string({ required_error: 'Duration is required' })
      .min(1, 'Duration is required')
      .optional(),

    price: z
      .number({ required_error: 'Price is required' })
      .positive('Price must be a positive number')
      .refine((val) => Number(val.toFixed(2)) === val, {
        message: 'Price can have at most 2 decimal places',
      })
      .optional(),

    date: z
      .string({ required_error: 'Date is required' })
      .min(1, 'Date is required')
      .optional(),

    time: z
      .string({ required_error: 'Time is required' })
      .min(1, 'Time is required')
      .optional(),

    // Optional booking request field
    request: BookingRequestSchemaZod.optional(),
  }),
});

const assignedMemberValidationSchema = z.object({
  body: z.object({
    assignedToMember: z
      .string({ required_error: 'Please select a member to assign' })
      .min(1, 'Assigned member cannot be empty'), // ensures non-empty string
  }),
});

const updateBookingStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([...BookingStatus] as [string, ...string[]]),
  }),
});

export const BookingValidation = {
  createBookingValidationSchema,
  updateBookingValidationSchema,
  assignedMemberValidationSchema,
  updateBookingStatusValidationSchema,
};
