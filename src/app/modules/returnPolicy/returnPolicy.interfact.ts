import { Types } from 'mongoose';

export type TReturnPolicy = {
  vendor: Types.ObjectId | string;
  content: string;
  isDeleted: boolean;
};
