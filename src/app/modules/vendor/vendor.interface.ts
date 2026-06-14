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
  chooseOffer?: TChooseOffer;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    streetAddress?: string;
  };

  reviewCount: number;
  avgRating: number;

  teamMembers?: Types.ObjectId[];

  // 🔹 Referral
  referralCode: string;
  referralLink: string;
  totalReferralPoints: number;
  totalReferredUsers: number;

  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TMetricWithChange = {
  count: number;
  changePercent: number;
};

export type TDashboardStats = {
  totalTransactions: TMetricWithChange;
  totalBookings: TMetricWithChange;
  pendingOrders: TMetricWithChange;
  pendingBookings: TMetricWithChange;
};
