import { TRole, TStatus, TSubscribed } from './user.interface';

export const USER_ROLE = {
  vendor: 'vendor',
  user: 'user',
  admin: 'admin',
} as const;

export const UserRole: TRole[] = ['vendor', 'user', 'admin'];

export const UserStatus: TStatus[] = ['ongoing', 'confirmed', 'blocked'];

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
