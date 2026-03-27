import { Model, ObjectId } from 'mongoose';
import { USER_ROLE } from './user.constant';

export type TRole = 'user' | 'vendor' | 'admin';

export type TStatus = 'ongoing' | 'confirmed' | 'blocked';

export type TSubscribed = 'advance' | 'basic';

export type TUser = {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  needsPasswordChange: boolean;
  passwordChangeAt?: Date;
  role: TRole;
  image?: string;
  coverImage?: string;
  country?: string;
  status: TStatus;

  isVerified: boolean;
  verification: {
    otp: string | number;
    expiresAt: Date;
    status: boolean;
  };
  isSubscribed: boolean;
  subscribed?: TSubscribed;

  notifications: boolean;

  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    streetAddress?: string;
  };

  // 🔹 Stripe (Customer)
  stripeCustomerId?: string;

  // 🔹 Stripe (Vendor / Connect)
  stripeAccountId?: string;
  stripeOnboardingComplete?: boolean;

  isDeleted: boolean;
};

export interface UserModel extends Model<TUser> {
  isUserExistsByEmail(email: string): Promise<TUser>;

  isPasswordMatched(
    plainTextPassword: string,
    hashPassword: string,
  ): Promise<boolean>;

  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number,
  ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;
