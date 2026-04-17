import { Types } from 'mongoose';

export type TTeamMemberRole = 'team_member' | 'manager' | 'supervisor';

export type TTeamMember = {
  _id?: string;
  vendor: Types.ObjectId;
  user?: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  image: string;
  role: TTeamMemberRole;
  speciality: string;
  // future ready
  customPermissions?: string[];
  timeZone: string;
  workHours: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
