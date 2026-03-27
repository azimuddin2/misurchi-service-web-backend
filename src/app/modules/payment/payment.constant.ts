import { TDeliveryStatus, TStatus } from './payment.interface';

export const Status: TStatus[] = ['pending', 'paid', 'refunded'];

export enum PAYMENT_STATUS {
  pending = 'pending',
  paid = 'paid',
  refunded = 'refunded',
  cancelled = 'cancelled',
}

export const DeliveryStatus: TDeliveryStatus[] = [
  'pending',
  'shipped',
  'delivered',
];
