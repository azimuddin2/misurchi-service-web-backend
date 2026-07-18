import { TRole, TStatus, TSubscribed } from './user.interface';

export const USER_ROLE = {
  vendor: 'vendor',
  user: 'user',
  admin: 'admin',
  team_member: 'team_member',
} as const;

export const UserRole: TRole[] = ['vendor', 'user', 'admin', 'team_member'];

export const UserStatus: TStatus[] = [
  'ongoing',
  'confirmed',
  'blocked',
  'deactivated',
];

export enum Login_With {
  google = 'google',
  apple = 'apple',
  credentials = 'credentials',
}

export const Subscribed: TSubscribed[] = ['advance', 'basic'];

export const userSearchableFields = [
  'firstName',
  'lastName',
  'fullName',
  'email',
  'phone',
  'country',
  'status',
];
