import { model, Schema } from 'mongoose';
import { TRecommendedType } from './recommendedType.interface';

const recommendedTypeSchema = new Schema<TRecommendedType>(
  {
    name: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const RecommendedType = model<TRecommendedType>(
  'RecommendedType',
  recommendedTypeSchema,
);
