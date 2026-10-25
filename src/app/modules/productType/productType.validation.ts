import { z } from 'zod';

const createProductTypeValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Product type is required',
    }),
  }),
});

const updateProductTypeValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Product type is required',
      })
      .optional(),
  }),
});

export const ProductTypeValidations = {
  createProductTypeValidationSchema,
  updateProductTypeValidationSchema,
};
