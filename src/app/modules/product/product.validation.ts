import { z } from 'zod';
import { HighlightStatus, ProductStatus } from './product.constant';

const createProductValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Product name is required',
    }),

    productType: z.string({
      required_error: 'Product type is required',
    }),

    quantity: z.number({
      required_error: 'Quantity is required',
    }),

    price: z.number({
      required_error: 'Price is required',
    }),

    discountPrice: z.string().optional(),

    colors: z.array(z.string(), {
      required_error: 'At least one color is required',
    }),

    recommendedType: z.array(z.string()).optional(),

    size: z.array(z.string(), {
      required_error: 'At least one size is required',
    }),

    status: z.enum([...ProductStatus] as [string, ...string[]], {
      required_error: 'Product status is required',
    }),

    description: z.string({
      required_error: 'Product description is required',
    }),
  }),
});

const updateProductValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Product name is required',
      })
      .optional(),

    productType: z
      .string({
        required_error: 'Product type is required',
      })
      .optional(),

    quantity: z
      .number({
        required_error: 'Quantity is required',
      })
      .optional(),

    price: z
      .number({
        required_error: 'Price is required',
      })
      .optional(),

    discountPrice: z
      .string()
      .min(0, 'Discount must be at least 0')
      .max(100, "Discount can't exceed 100")
      .nullable()
      .optional(),

    colors: z
      .array(z.string(), {
        required_error: 'At least one color is required',
      })
      .optional(),

    recommendedType: z.array(z.string()).optional(),

    size: z
      .array(z.string(), {
        required_error: 'At least one size is required',
      })
      .optional(),

    status: z
      .enum([...ProductStatus] as [string, ...string[]], {
        required_error: 'Product status is required',
      })
      .optional(),

    description: z
      .string({
        required_error: 'Product description is required',
      })
      .optional(),
  }),
});

const updateProductStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([...ProductStatus] as [string, ...string[]]),
  }),
});

const updateProductHighlightStatusValidationSchema = z.object({
  body: z.object({
    highlightStatus: z.enum([...HighlightStatus] as [string, ...string[]]),
  }),
});

export const ProductValidations = {
  createProductValidationSchema,
  updateProductValidationSchema,
  updateProductStatusValidationSchema,
  updateProductHighlightStatusValidationSchema,
};
