import { z } from 'zod';
import { TaskStatus } from './task.constant';

const createTaskValidationSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }),

    description: z.string({
      required_error: 'Description is required',
    }),

    date: z.string({
      required_error: 'Date is required',
    }),

    time: z.string({
      required_error: 'Time is required',
    }),

    assignor: z
      .string({
        required_error: 'Assignor is required',
      })
      .optional(),

    assignTeamMember: z.string({
      required_error: 'Team member is required',
    }),

    reviewers: z.array(z.string()).optional(),
  }),
});

const updateTaskValidationSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: 'Title is required',
      })
      .optional(),

    description: z
      .string({
        required_error: 'Description is required',
      })
      .optional(),

    date: z
      .string({
        required_error: 'Date is required',
      })
      .optional(),

    time: z
      .string({
        required_error: 'Time is required',
      })
      .optional(),

    assignor: z
      .string({
        required_error: 'Assignor is required',
      })
      .optional(),

    assignTeamMember: z
      .string({
        required_error: 'Team member is required',
      })
      .optional(),

    reviewers: z.array(z.string()).optional(),
  }),
});

const updateTaskStatusValidationSchema = z.object({
  body: z
    .object({
      status: z.enum([...TaskStatus] as [string, ...string[]]),
      blockedInfo: z
        .object({
          reason: z.string({
            required_error: 'Reason is required when task is blocked',
          }),
          resolver: z.string({
            required_error: 'Resolver is required when task is blocked',
          }),
        })
        .optional(),
      reviewers: z.array(z.string()).optional(),
    })
    .refine(
      (data) => data.status !== 'Blocked/Dependencies' || !!data.blockedInfo,
      {
        message:
          'blockedInfo (reason, resolver) is required when status is Blocked/Dependencies',
        path: ['blockedInfo'],
      },
    )
    .refine(
      (data) =>
        data.status !== 'Needs Review' ||
        (Array.isArray(data.reviewers) && data.reviewers.length > 0),
      {
        message:
          'At least one reviewer is required when status is Needs Review',
        path: ['reviewers'],
      },
    ),
});

const addNoteValidationSchema = z.object({
  body: z.object({
    text: z.string({
      required_error: 'Note text is required',
    }),
    status: z.enum([...TaskStatus] as [string, ...string[]]).optional(),
  }),
});

export const TaskValidations = {
  createTaskValidationSchema,
  updateTaskValidationSchema,
  updateTaskStatusValidationSchema,
  addNoteValidationSchema,
};
