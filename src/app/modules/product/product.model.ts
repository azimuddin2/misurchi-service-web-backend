import { model, Schema } from 'mongoose';
import { TProduct } from './product.interface';
import { HighlightStatus, ProductStatus } from './product.constant';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new Schema<TProduct>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User Id is required'],
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    productCode: {
      type: String,
      required: true,
    },
    images: {
      type: [imageSchema],
      required: true,
    },
    productType: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: String,
      default: null,
      min: 0,
      max: 100,
    },
    colors: {
      type: [String],
      required: true,
    },
    recommendedType: {
      type: [String],
      required: false,
    },
    size: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ProductStatus,
        message: '{VALUE} is not valid',
      },
      default: 'Available',
    },
    highlightStatus: {
      type: String,
      enum: {
        values: HighlightStatus,
        message: '{VALUE} is not valid',
      },
      default: 'Highlight',
    },
    description: {
      type: String,
      required: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    avgRating: {
      type: Number,
      default: 0,
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

export const Product = model<TProduct>('Product', productSchema);
