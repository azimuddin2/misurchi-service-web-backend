import { TStatus } from './task.interface';

export const TaskStatus: TStatus[] = [
  'To-Do',
  'In Progress',
  'Needs Review',
  'Blocked/Dependencies',
  'Done',
  'Obsolete',
];

export const taskSearchableFields = ['title', 'description'];
