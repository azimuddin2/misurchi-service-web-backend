import z from 'zod';
import { ChooseOffer } from './vendor.constant';

const vendorRegisterUserValidationSchema = z.object({
  body: z
    .object({
      businessName: z.string({
        required_error: 'Business name is required',
        invalid_type_error: 'Business name must be a string',
      }),

      email: z
        .string({
          required_error: 'Email is required',
        })
        .email('Invalid email address'),

      phone: z
        .string({
          required_error: 'Phone number is required',
        })
        .transform((v) => v.replace(/\s+/g, ''))
        .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')),

      country: z.string({
        required_error: 'Country is required',
      }),

      street: z.string({
        required_error: 'Street address is required',
      }),

      state: z.string({
        required_error: 'State is required',
      }),

      zipCode: z.string({
        required_error: 'Zip code is required',
      }),

      currency: z.string({
        required_error: 'Currency is required',
      }),

      timeZone: z.string({
        required_error: 'Time zone is required',
      }),

      workHours: z.string({
        required_error: 'Work hours are required',
      }),

      image: z.string().optional(),

      firstName: z.string({
        required_error: 'First name is required',
      }),

      lastName: z.string({
        required_error: 'Last name is required',
      }),

      password: z
        .string({
          required_error: 'Password is required',
        })
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(
          /[!@#$%^&*]/,
          'Password must contain at least one special character',
        ),

      confirmPassword: z
        .string({
          required_error: 'Confirm password is required',
        })
        .min(8, 'Confirm password must be at least 8 characters'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Password & ConfirmPassword do not match',
      path: ['confirmPassword'],
    }),
});

const updateVendorUserValidationSchema = z.object({
  body: z.object({
    businessName: z
      .string({
        required_error: 'Business name is required',
        invalid_type_error: 'Business name must be a string',
      })
      .optional(),

    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address')
      .optional(),

    phone: z
      .string({
        required_error: 'Phone number is required',
      })
      .transform((v) => v.replace(/\s+/g, ''))
      .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'))
      .optional(),

    country: z
      .string({
        required_error: 'Country is required',
      })
      .optional(),

    street: z
      .string({
        required_error: 'Street address is required',
      })
      .optional(),

    state: z
      .string({
        required_error: 'State is required',
      })
      .optional(),

    zipCode: z
      .string({
        required_error: 'Zip code is required',
      })
      .optional(),

    currency: z
      .string({
        required_error: 'Currency is required',
      })
      .optional(),

    timeZone: z
      .string({
        required_error: 'Time zone is required',
      })
      .optional(),

    workHours: z
      .string({
        required_error: 'Work hours are required',
      })
      .optional(),

    image: z.string().optional(),

    firstName: z
      .string({
        required_error: 'First name is required',
      })
      .optional(),

    lastName: z
      .string({
        required_error: 'Last name is required',
      })
      .optional(),
  }),
});

const chooseOfferValidationSchema = z.object({
  body: z.object({
    chooseOffer: z.enum([...ChooseOffer] as [string, ...string[]]),
  }),
});

export const VendorValidations = {
  vendorRegisterUserValidationSchema,
  updateVendorUserValidationSchema,
  chooseOfferValidationSchema,
};
