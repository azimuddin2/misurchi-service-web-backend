import { Types } from 'mongoose';

export type TCancellationPolicy = {
  vendor: Types.ObjectId | string;
  content: string;
  isDeleted: boolean;
};
