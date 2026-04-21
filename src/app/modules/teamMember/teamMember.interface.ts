import { Types } from 'mongoose';

export type TTeamMemberRole = 'team_member' | 'manager' | 'supervisor';

export type TPermission =
  | 'assign_tasks'
  | 'initiate_refunds'
  | 'approve_refunds'
  | 'filter_transactions'
  | 'respond_to_messages'
  | 'cancel_reschedule_appointments'
  | 'add_edit_users'
  | 'assign_discounts'
  | 'create_edit_offerings';

export type TTeamMember = {
  _id?: string;
  vendor: Types.ObjectId;
  user?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  image: string;
  role: TTeamMemberRole;
  speciality: string;
  // permissions?: TPermission[];
  timeZone: string;
  workHours: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
