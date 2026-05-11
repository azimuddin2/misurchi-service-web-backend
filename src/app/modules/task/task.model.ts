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
    assignTeamMember: {
      type: Schema.Types.ObjectId,
      required: [true, 'Team member is required'],
      ref: 'TeamMember',
    },
    status: {
      type: String,
      enum: {
        values: TaskStatus,
        message: '{VALUE} is not valid',
      },
      default: 'To-Do',
    },
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
