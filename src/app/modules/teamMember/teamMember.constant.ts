import { TPermission, TTeamMemberRole } from './teamMember.interface';

export const TeamMemberRole: TTeamMemberRole[] = [
  'manager',
  'supervisor',
  'team_member',
];

export const AllPermissions: TPermission[] = [
  'dashboard',
  'profile',
  'manage_offering',
  'activity_center',
  'filter_transactions',
  'respond_to_messages',
  'feedback_history',
  'shared_calendar',
  'assign_tasks',
  'team_members',
  'settings',
];

export const TeamMemberPermission: Record<TTeamMemberRole, TPermission[]> = {
  team_member: [
    'dashboard',
    'profile',
    'activity_center',
    'filter_transactions',
    'respond_to_messages',
    'assign_tasks',
    'settings',
  ],
  supervisor: [
    'dashboard',
    'profile',
    'manage_offering',
    'activity_center',
    'filter_transactions',
    'respond_to_messages',
    'feedback_history',
    'shared_calendar',
    'assign_tasks',
    'team_members',
    'settings',
  ],
  manager: [
    'dashboard',
    'profile',
    'manage_offering',
    'activity_center',
    'filter_transactions',
    'respond_to_messages',
    'feedback_history',
    'shared_calendar',
    'assign_tasks',
    'team_members',
    'settings',
  ],
};

export const teamMemberSearchableFields = [
  'name',
  'email',
  'speciality',
  'role',
  'phone',
];
