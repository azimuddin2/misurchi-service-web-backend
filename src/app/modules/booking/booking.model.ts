import { model, Schema } from 'mongoose';
import { IBookingRequest, TBooking } from './booking.interface';
import { BookingStatus, PaymentStatus, PaymentType } from './booking.constant';

const BookingRequestSchema = new Schema<IBookingRequest>({
  type: {
    type: String,
    enum: ['none', 'cancel', 'reschedule'],
    default: 'none',
  },
  reason: { type: String },
  newDate: { type: String },
  newTime: { type: String },
  vendorApproved: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const bookingSchema = new Schema<TBooking>(
  {
    bookingId: {
      type: String,
      required: true,
    },
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
    serviceId: {
      type: String,
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      required: [true, 'Service Id is required'],
      ref: 'Packages',
    },
    serviceItemId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: BookingStatus,
        message: '{VALUE} is not valid',
      },
      default: 'pending',
    },
    paymentType: {
      type: String,
      enum: {
        values: PaymentType,
        message: '{VALUE} is not valid',
      },
      default: 'full',
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PaymentStatus,
        message: '{VALUE} is not valid',
      },
      default: 'pending',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPaid: { type: Boolean, default: false },
    trnId: { type: String },
    assignedTo: {
      type: String,
    },
    request: { type: BookingRequestSchema, default: {} },
  },
  { timestamps: true },
);

// ✅ Enforce one-slot-one-booking
bookingSchema.index(
  { service: 1, serviceName: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export const Booking = model<TBooking>('Booking', bookingSchema);
