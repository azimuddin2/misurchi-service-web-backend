import { model, Schema } from 'mongoose';
import { TTask } from './task.interface';
import { TaskStatus } from './task.constant';

const taskSchema = new Schema<TTask>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    assignor: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
    },
    assignTeamMember: {
      type: Schema.Types.ObjectId,
      required: [true, 'Team member is required'],
      ref: 'TeamMember',
    },
    reviewers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'TeamMember',
      },
    ],
    blockedInfo: {
      reason: {
        type: String,
      },
      resolver: {
        type: Schema.Types.ObjectId,
        ref: 'TeamMember',
      },
      taggedAt: {
        type: Date,
      },
      resolvedAt: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: {
        values: TaskStatus,
        message: '{VALUE} is not valid',
      },
      default: 'To-Do',
    },
    notes: [
      {
        text: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          required: true,
        },
        author: {
          type: Schema.Types.ObjectId,
          ref: 'TeamMember',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Task = model<TTask>('Task', taskSchema);
