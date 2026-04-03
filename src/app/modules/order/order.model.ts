import { model, Schema } from 'mongoose';
import { TOrder } from './order.interface';
import { OrderStatus } from './order.constant';

const orderProductSchema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    product: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product Id is required'],
      ref: 'Product',
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    size: { type: String, required: true },
    color: { type: String, required: true },
  },
  { _id: false }, // prevent creating extra _id for each product item
);

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
  },
  { _id: false },
);

const OrderRequestSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['none', 'cancelled', 'return'],
      default: 'none',
    },
    images: { type: [ImageSchema], default: [] },
    reason: { type: String },
    vendorApproved: { type: Boolean, default: false },
    updatedAt: { type: Date },
  },
  { _id: false },
);

// Main Schema
const orderSchema = new Schema<TOrder>(
  {
    orderId: {
      type: String,
      required: true,
    },
    products: {
      type: [orderProductSchema],
      required: true,
    },

    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },

    buyer: {
      type: Schema.Types.ObjectId,
      required: [true, 'User Id is required'],
      ref: 'User',
    },

    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    customerPhone: { type: String, required: true, trim: true },

    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: {
        values: OrderStatus,
        message: '{VALUE} is not valid',
      },
      default: 'pending',
    },

    request: { type: OrderRequestSchema, default: () => ({}) },

    isPaid: { type: Boolean, default: false },
    trnId: { type: String },

    billingDetails: {
      country: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String, required: true },
      address: { type: String, required: true },
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Order = model<TOrder>('Order', orderSchema);
