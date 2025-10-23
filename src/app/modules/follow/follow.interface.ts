import { Types } from 'mongoose';

export type TFollow = {
  _id?: Types.ObjectId;
  follower: Types.ObjectId;
  vendor: Types.ObjectId;
};
