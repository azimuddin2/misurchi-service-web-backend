import { Types } from 'mongoose';

export type TImage = {
  url: string;
  key: string;
};

export type TOrderStatus = 'pending' | 'shipped' | 'delivered';

export type TOrderRequestType = 'none' | 'cancelled' | 'return';

export type TOrderRequest = {
  type?: TOrderRequestType;
  images?: TImage[];
  deleteKey?: string[];
  reason?: string;
  vendorApproved?: boolean;
  updatedAt?: Date;
};

export type TOrderProduct = {
  name: string;
  image: string;
  product: Types.ObjectId;
  quantity: number;
  price: number;
  discount: number;
  size: string;
  color: string;
};

export type TOrder = {
  orderId: string;
  products: TOrderProduct[];
  vendor: Types.ObjectId | string;
  buyer: Types.ObjectId | string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  totalPrice: number;

  status: TOrderStatus;
  request: TOrderRequest;
  isPaid: boolean;
  trnId?: string;

  billingDetails: {
    country: string;
    city?: string;
    state?: string;
    zipCode: string;
    address: string;
  };
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};
