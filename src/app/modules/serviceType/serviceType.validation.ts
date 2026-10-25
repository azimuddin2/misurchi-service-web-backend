import { z } from 'zod';

const createServiceTypeValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Service type is required',
    }),
  }),
});

const updateServiceTypeValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Service type is required',
      })
      .optional(),
  }),
});

export const ServiceTypeValidations = {
  createServiceTypeValidationSchema,
  updateServiceTypeValidationSchema,
};
