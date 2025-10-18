import { ObjectId } from 'mongoose';

export type TFollow = {
  follower: ObjectId;
  following: ObjectId;
};
