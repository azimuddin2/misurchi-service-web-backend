import { Types } from 'mongoose';

export type TValidityType = 'free' | '1month' | '1year';

export type TPlan = {
  user: Types.ObjectId;
  name: string;
  cost: number;
  description: string;

  features: {
    teamMembers: boolean;
    sharedCalendar: boolean;
    taskHub: boolean;
    grantPermissionAccess: boolean;
  };

  limits: {
    serviceMax: number;
    productMax: number;
    highlightOfferMax: number;
    transactionFee: number;
  };

  validity: TValidityType;

  stripeProductId: string;
  stripePriceId: string;

  isDeleted?: boolean;
  isActive: boolean;
};
