import { Schema, model } from 'mongoose';
import { TDaySchedule, TPackages, TServicePricing } from './packages.interface';
import { HighlightStatus } from './packages.constant';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
  },
  { _id: false },
);

const ServicePricingSchema = new Schema<TServicePricing>(
  {
    id: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: String, required: true },
    discount: { type: String },
    finalPrice: { type: String, required: true },
  },
  { _id: false },
);

const DayScheduleSchema = new Schema<TDaySchedule>(
  {
    enabled: { type: Boolean, required: true, default: false },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false },
);

const packagesSchema = new Schema<TPackages>(
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
    deleteKey: [{ type: String, required: true }],
    serviceId: { type: String, required: true },
    name: { type: String, required: true },
    images: {
      type: [imageSchema],
      required: true,
    },
    type: { type: String, required: true },
    savedServices: { type: [ServicePricingSchema], required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
    },
    highlightStatus: {
      type: String,
      enum: {
        values: HighlightStatus,
        message: '{VALUE} is not valid',
      },
      default: 'Highlight',
    },
    availability: {
      weeklySchedule: {
        type: Map,
        of: DayScheduleSchema,
        default: {},
      },
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
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Packages = model<TPackages>('Packages', packagesSchema);
