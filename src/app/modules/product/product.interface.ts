import { Types } from 'mongoose';
import { TVendor } from '../vendor/vendor.interface';
import { TUser } from '../user/user.interface';
import { TReview } from '../review/review.interface';

export type TProductImage = {
  url: string;
  key: string;
};

export type TProductStatus =
  | 'Available'
  | 'Out of Stock'
  | 'TBC'
  | 'Discontinued';

export type THighlightStatus = 'Highlighted' | 'Highlight';

export type TProduct = {
  vendor: Types.ObjectId | TVendor | string;
  user: Types.ObjectId | TUser | string;
  name: string;
  productCode: string;
  images: TProductImage[];
  productType: string;
  quantity: number;
  price: number;
  discountPrice?: string | null;
  colors: string[];
  recommendedType: string[];
  size: string[];
  status: TProductStatus;
  highlightStatus: THighlightStatus;
  description: string;
  deleteKey: string[];
  reviews?: Types.ObjectId[] | TReview[];
  avgRating?: number;
  isDeleted: boolean;
};
