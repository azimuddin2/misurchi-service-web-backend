import { z } from 'zod';
import { TeamMemberRole } from './teamMember.constant';

// ─── Create ──────────────────────────────────────────────────────
const createTeamMemberValidationSchema = z.object({
  body: z.object({
    vendor: z.string({ required_error: 'Vendor Id is required' }),

    name: z.string({ required_error: 'Name is required' }),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .toLowerCase(),

    phone: z
      .string({ required_error: 'Phone number is required' })
      .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),

    role: z
      .enum(TeamMemberRole as [string, ...string[]])
      .default('team_member'),

    speciality: z.string({ required_error: 'Speciality is required' }),

    customPermissions: z.array(z.string()).optional(),

    timeZone: z.string({ required_error: 'Time zone is required' }),

    workHours: z.string({ required_error: 'Work hours are required' }),
  }),
});

// ─── Update (optional) ─────────────────────────────────────
const updateTeamMemberValidationSchema = z.object({
  body: z
    .object({
      name: z.string().trim().optional(),

      email: z.string().email('Invalid email address').toLowerCase().optional(),

      phone: z
        .string()
        .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number')
        .optional(),

      role: z.enum(TeamMemberRole as [string, ...string[]]).optional(),

      speciality: z.string().optional(),

      customPermissions: z.array(z.string()).optional(),

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
