import { TSubscribed } from '../user/user.interface';
import { TChooseOffer } from './vendor.interface';

export const vendorSearchableFields = [
  'businessName',
  'email',
  'firstName',
  'firstName',
  'country',
];

export const Subscribed: TSubscribed[] = ['advance', 'basic'];

export const ChooseOffer: TChooseOffer[] = ['products', 'services', 'both'];
