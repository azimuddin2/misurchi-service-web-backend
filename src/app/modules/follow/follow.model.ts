import { model, Schema } from 'mongoose';
import { TFollow } from './follow.interface';

const followSchema = new Schema<TFollow>(
  {
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = model<TFollow>('Follow', followSchema);
