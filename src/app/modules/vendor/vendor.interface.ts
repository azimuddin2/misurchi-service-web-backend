import { Types } from 'mongoose';

export type TSubscribed = 'advance' | 'basic';
export type TChooseOffer = 'services' | 'products' | 'both'

export type TVendor = {
  userId: Types.ObjectId;
  businessName: string;
  email: string;
  phone: string;
  country: string;
  street: string;
  state: string;
  zipCode: string;
  currency: string;
  timeZone: string;
  workHours: string;
  image?: string | null;
  firstName: string;
  lastName: string;
  description?: string;
  password: string;
  confirmPassword: string;

  chooseOffer?: TChooseOffer;
  isSubscribed?: TSubscribed;
};
