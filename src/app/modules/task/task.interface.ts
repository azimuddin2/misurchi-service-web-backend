import { Types } from 'mongoose';
import { TTeamMember } from '../teamMember/teamMember.interface';

export type TStatus =
  | 'To-Do'
  | 'In Progress'
  | 'Needs Review'
  | 'Blocked/Dependencies'
  | 'Done'
  | 'Obsolete';

export type TNote = {
  text: string;
  status: TStatus;
  createdAt: Date;
};

export type TTask = {
  vendor: Types.ObjectId;
  _id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  assignTeamMember: Types.ObjectId | TTeamMember;
  status: TStatus;
  notes?: TNote[];
  isDeleted: boolean;
};
