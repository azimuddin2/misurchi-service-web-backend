import { z } from 'zod';
import { PAYMENT_MODEL_TYPE } from './payment.interface';
import { DeliveryStatus, Status } from './payment.constant';

// 🔹 Base schema
const basePaymentSchema = z.object({
  user: z.string().min(1, 'User Id is required'),
  vendor: z.string().min(1, 'Vendor Id is required'),

  modelType: z.nativeEnum(PAYMENT_MODEL_TYPE),

  reference: z.string().min(1, 'Reference Id is required'), // Order or Booking Id

  status: z.enum(Status as [string, ...string[]]).default('pending'),

  trnId: z.string().min(1, 'Transaction Id is required'),

  adminAmount: z.number().nonnegative().optional(), // auto-calculated in mongoose
  vendorAmount: z.number().nonnegative().optional(),
  paymentIntentId: z.string().optional(),

  price: z.number().positive('Price must be greater than 0'),

  isDeleted: z.boolean().optional().default(false),
});

// 🔹 Order payment schema
const orderPaymentSchema = basePaymentSchema.extend({
  modelType: z.literal(PAYMENT_MODEL_TYPE.Order),
  deliveryStatus: z
    .enum(DeliveryStatus as [string, ...string[]])
    .default('pending'),
});

// 🔹 Booking payment schema
const bookingPaymentSchema = basePaymentSchema.extend({
  modelType: z.literal(PAYMENT_MODEL_TYPE.Booking),
});

// 🔹 Wrap inside `body:`
const createPaymentValidationSchema = z.object({
  body: z.union([orderPaymentSchema, bookingPaymentSchema]),
});

export const PaymentValidations = {
  createPaymentValidationSchema,
};
