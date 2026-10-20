import { z } from 'zod';
import { HighlightStatus, ServiceStatus } from './packages.constant';

const ServicePricingSchema = z.object({
  id: z.string({ required_error: 'Service ID is required' }),
  duration: z.string({ required_error: 'Duration is required' }),
  price: z.string({ required_error: 'Price is required' }),
  discount: z.string().optional(),
  finalPrice: z.string({ required_error: 'Final price is required' }),
});

const DayScheduleSchema = z.object({
  enabled: z.boolean().default(false),
  startTime: z.string({ required_error: 'Start time is required' }), // e.g. "09:00"
  endTime: z.string({ required_error: 'End time is required' }), // e.g. "17:00"
});

const createPackagesValidationSchema = z.object({
  body: z.object({
    vendor: z.string({ required_error: 'Vendor ID is required' }),
    name: z.string({ required_error: 'Name is required' }),
    type: z.string({ required_error: 'Type is required' }),
    savedServices: z
      .array(ServicePricingSchema, {
        required_error: 'At least one service is required',
      })
      .nonempty(),
    description: z.string().optional(),
    status: z
      .enum([...ServiceStatus] as [string, ...string[]])
      .default('available'),
    highlightStatus: z
      .enum(HighlightStatus as [string, ...string[]])
      .default('Highlight'),
    availability: z.object({
      weeklySchedule: z.record(DayScheduleSchema).default({}),
    }),
    isDeleted: z.boolean().default(false),
  }),
});

const updatePackagesValidationSchema = z.object({
  body: z.object({
    deleteKey: z.array(z.string()).optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    savedServices: z.array(ServicePricingSchema).optional(),
    description: z.string().optional(),
    status: z.enum([...ServiceStatus] as [string, ...string[]]).optional(),
    highlightStatus: z
      .enum(HighlightStatus as [string, ...string[]])
      .optional(),
    availability: z
      .object({
        weeklySchedule: z.record(DayScheduleSchema).optional(),
      })
      .optional(),
    isDeleted: z.boolean().optional(),
  }),
});

const updatePackagesStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([...ServiceStatus] as [string, ...string[]]),
  }),
});

const updatePackagesHighlightStatusValidationSchema = z.object({
  body: z.object({
    highlightStatus: z.enum([...HighlightStatus] as [string, ...string[]]),
  }),
});

export const PackagesValidations = {
  createPackagesValidationSchema,
  updatePackagesValidationSchema,
  updatePackagesStatusValidationSchema,
  updatePackagesHighlightStatusValidationSchema,
};
