import { Types } from 'mongoose';

export type TChooseOffer = 'services' | 'products' | 'both';

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
  coverImage?: string;
  firstName: string;
  lastName: string;
  description?: string;
  password: string;
  confirmPassword: string;
  stripeAccountId?: string;
  chooseOffer?: TChooseOffer;
  location?: {
    streetAddress?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
};
