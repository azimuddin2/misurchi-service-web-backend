import { z } from 'zod';
import { TeamMemberRole } from './teamMember.constant';

// ─── Create ──────────────────────────────────────────────────────
const createTeamMemberValidationSchema = z.object({
  body: z.object({
    vendor: z.string({ required_error: 'Vendor Id is required' }),
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
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .toLowerCase(),
    phone: z
      .string({
        required_error: 'Phone number is required',
      })
      .transform((v) => v.replace(/\s+/g, ''))
      .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')),
    role: z
      .enum(TeamMemberRole as [string, ...string[]])
      .default('team_member'),
    speciality: z.string({ required_error: 'Speciality is required' }),
    timeZone: z.string({ required_error: 'Time zone is required' }),
    workHours: z.string({ required_error: 'Work hours are required' }),
  }),
});

// ─── Update (optional) ─────────────────────────────────────
const updateTeamMemberValidationSchema = z.object({
  body: z
    .object({
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

      email: z.string().email('Invalid email address').toLowerCase().optional(),
      phone: z
        .string({
          required_error: 'Phone number is required',
        })
        .transform((v) => v.replace(/\s+/g, ''))
        .pipe(z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'))
        .optional(),

      role: z.enum(TeamMemberRole as [string, ...string[]]).optional(),
      speciality: z.string().optional(),
      timeZone: z.string().optional(),
      workHours: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .strict(),
});

export const TeamMemberValidation = {
  createTeamMemberValidationSchema,
  updateTeamMemberValidationSchema,
};
