import { model, Schema } from 'mongoose';
import { TReview } from './review.interface';

const reviewSchema = new Schema<TReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User Id is required'],
      ref: 'User',
    },
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Packages',
      required: false,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

// 🔹 Validation: Ensure only ONE of product/service is filled
reviewSchema.pre('save', function (next) {
  if (this.product && this.service) {
    return next(
      new Error(
        'A review can only be linked to either a product OR a service.',
      ),
    );
  }
  if (!this.product && !this.service) {
    return next(
      new Error('A review must be linked to either a product OR a service.'),
    );
  }
  next();
});

export const Review = model<TReview>('Review', reviewSchema);
