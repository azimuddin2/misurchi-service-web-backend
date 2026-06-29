import { z } from 'zod';
import { UserRole, UserStatus } from './user.constant';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const phoneValidation = z
  .string({
    required_error: 'Phone number is required',
  })
  .transform((v) => v.replace(/\s+/g, ''))
  .superRefine((value, ctx) => {
    const phoneNumber = parsePhoneNumberFromString(value);

    if (!phoneNumber || !phoneNumber.isValid()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid phone number',
      });
    }
  });

const registerUserValidationSchema = z.object({
  body: z
    .object({
      firstName: z
        .string({
          required_error: 'First name is required',
          invalid_type_error: 'First name must be a string',
        })
        .min(3, 'First name must be at least 3 characters')
        .max(20, 'First name cannot exceed 20 characters'),

      lastName: z
        .string({
          required_error: 'Last name is required',
          invalid_type_error: 'Last name must be a string',
        })
        .min(3, 'Last name must be at least 3 characters')
        .max(20, 'Last name cannot exceed 20 characters'),

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

      role: z.enum([...UserRole] as [string, ...string[]]).default('user'),

      image: z.string().optional(),
      location: z
        .object({
          type: z.string().optional(),
          coordinates: z.array(z.number()).optional(),
          streetAddress: z.string().optional(),
        })
        .optional(),

      status: z
        .enum([...UserStatus] as [string, ...string[]])
        .default('ongoing'),

      isDeleted: z.boolean().optional().default(false),

      isVerified: z.boolean().default(false),

      verification: z
        .object({
          otp: z.string().optional(),
          expiresAt: z.date().optional(),
          status: z.boolean().optional(),
        })
        .optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Password & ConfirmPassword do not match',
      path: ['confirmPassword'],
    }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    firstName: z
      .string({
        required_error: 'First name is required',
        invalid_type_error: 'First name must be a string',
      })
      .min(3, 'First name must be at least 3 characters')
      .max(20, 'First name cannot exceed 20 characters')
      .optional(),

    lastName: z
      .string({
        required_error: 'Last name is required',
        invalid_type_error: 'Last name must be a string',
      })
      .min(3, 'Last name must be at least 3 characters')
      .max(20, 'Last name cannot exceed 20 characters')
      .optional(),

    phone: phoneValidation.optional(),

    role: z
      .enum([...UserRole] as [string, ...string[]])
      .default('user')
      .optional(),

    image: z.string().optional(),

    status: z
      .enum([...UserStatus] as [string, ...string[]])
      .default('ongoing')
      .optional(),

    isDeleted: z.boolean().optional().default(false),

    isVerified: z.boolean().default(false),

    verification: z
      .object({
        otp: z.string().optional(),
        expiresAt: z.date().optional(),
        status: z.boolean().optional(),
      })
      .optional(),
  }),
});

const changeStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([...UserStatus] as [string, ...string[]]),
  }),
});

const notificationSettingsValidationSchema = z.object({
  body: z.object({
    notifications: z.boolean({
      required_error: 'Notifications setting is required',
      invalid_type_error: 'Notifications must be true or false',
    }),
  }),
});

export const UserValidations = {
  registerUserValidationSchema,
  updateUserValidationSchema,
  changeStatusValidationSchema,
  notificationSettingsValidationSchema,
};
