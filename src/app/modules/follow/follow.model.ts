import { Schema, model } from 'mongoose';
import { TFollow } from './follow.interface';

const FollowSchema = new Schema<TFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  },
  { timestamps: true },
);

FollowSchema.index({ follower: 1, vendor: 1 }, { unique: true });

export const Follow = model<TFollow>('Follow', FollowSchema);
