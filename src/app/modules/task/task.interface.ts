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
  author: Types.ObjectId | TTeamMember;
  createdAt: Date;
};

export type TBlockedInfo = {
  reason: string;
  resolver: Types.ObjectId | TTeamMember;
  taggedAt: Date;
  resolvedAt?: Date;
};

export type TTask = {
  vendor: Types.ObjectId;
  _id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  assignor: Types.ObjectId | TTeamMember;
  assignTeamMember: Types.ObjectId | TTeamMember;
  reviewers?: (Types.ObjectId | TTeamMember)[];
  blockedInfo?: TBlockedInfo;
  status: TStatus;
  notes?: TNote[];
  isDeleted: boolean;
};
