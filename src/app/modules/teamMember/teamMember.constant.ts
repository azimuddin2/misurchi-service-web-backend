import { TPermission, TTeamMemberRole } from './teamMember.interface';

export const TeamMemberRole: TTeamMemberRole[] = [
  'manager',
  'supervisor',
  'team_member',
];

// teamMember.constant.t

// ✅ Schema enum এর জন্য flat array
export const AllPermissions: TPermission[] = [
  'assign_tasks',
  'initiate_refunds',
  'approve_refunds',
  'filter_transactions',
  'respond_to_messages',
  'cancel_reschedule_appointments',
  'add_edit_users',
  'assign_discounts',
  'create_edit_offerings',
];

// ✅ Role → Permissions map
export const TeamMemberPermission: Record<TTeamMemberRole, TPermission[]> = {
  team_member: [
    'assign_tasks',
    'filter_transactions',
    'respond_to_messages',
    'cancel_reschedule_appointments',
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
};

export const teamMemberSearchableFields = [
  'name',
  'email',
  'speciality',
  'role',
  'phone',
];
