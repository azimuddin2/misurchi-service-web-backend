import { TPermission, TTeamMemberRole } from './teamMember.interface';

export const TeamMemberRole: TTeamMemberRole[] = [
  'manager',
  'supervisor',
  'team_member',
];

export const TeamMemberPermission: Record<TTeamMemberRole, TPermission[]> = {
  team_member: [
    'assign_tasks',
    'initiate_refunds',
    'filter_transactions',
    'respond_to_messages',
    'cancel_reschedule_appointments',
  ],
  manager: [
    'assign_tasks',
    'initiate_refunds',
    'approve_refunds',
    'filter_transactions',
    'respond_to_messages',
    'cancel_reschedule_appointments',
    'add_edit_users',
    'assign_discounts',
    'create_edit_offerings',
  ],
  supervisor: [
    'assign_tasks',
    'initiate_refunds',
    'filter_transactions',
    'respond_to_messages',
    'cancel_reschedule_appointments',
    'add_edit_users',
    'assign_discounts',
    'create_edit_offerings',
  ],
};

export const teamMemberSearchableFields = [
  'name',
  'email',
  'speciality',
  'role',
  'phone',
];
