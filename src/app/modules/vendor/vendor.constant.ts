import { TSubscribed } from '../user/user.interface';
import { TChooseOffer } from './vendor.interface';

export const vendorSearchableFields = [
  'businessName',
  'email',
  'firstName',
  'firstName',
  'country',
  'zipCode',
  'state',
  'street',
  'phone',
];

export const Subscribed: TSubscribed[] = ['advance', 'basic'];

export const ChooseOffer: TChooseOffer[] = ['products', 'services', 'both'];
