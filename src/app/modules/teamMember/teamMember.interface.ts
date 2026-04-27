import { Types } from 'mongoose';
import { TVendor } from '../vendor/vendor.interface';

export type TTeamMemberRole = 'team_member' | 'manager' | 'supervisor';

export type TPermission =
  | 'dashboard'
  | 'profile'
  | 'manage_offering'
  | 'activity_center'
  | 'filter_transactions'
  | 'respond_to_messages'
  | 'feedback_history'
  | 'shared_calendar'
  | 'assign_tasks'
  | 'team_members'
  | 'settings';

export type TTeamMember = {
  _id?: string;
  vendor: Types.ObjectId | TVendor;
  user?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  role: TTeamMemberRole;
  speciality: string;
  permissions?: TPermission[];
  timeZone: string;
  workHours: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
