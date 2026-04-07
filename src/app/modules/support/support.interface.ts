export type TSupport = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  messageReply?: string;
  status: 'Pending' | 'Reviewed' | 'In Progress' | 'Resolved';
  isHelpful?: boolean | null;
  follow: boolean;
  isDeleted: boolean;
};
