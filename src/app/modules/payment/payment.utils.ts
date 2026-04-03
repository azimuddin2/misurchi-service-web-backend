import { PAYMENT_MODEL_TYPE, TPayment } from './payment.interface';
import { Order } from '../order/order.model';
import { Booking } from '../booking/booking.model';
import { Payment } from './payment.model';
import { User } from '../user/user.model';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import StripePaymentService from '../../class/stripe';
import { Vendor } from '../vendor/vendor.model';

export const generateTrxId = (): string => {
  // Example: TXN20251020A9F43B
  const prefix = 'TXN';
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${datePart}${randomPart}`;
};

// 🔹 Helper → calculate commission split (10% admin, 90% vendor)
export const calculateAmounts = (price: number) => ({
  adminAmount: price * 0.1,
  vendorAmount: price * 0.9,
});

// 🔹 Helper → fetch reference doc and resolve price
export const resolveReferenceDoc = async (payload: TPayment) => {
  if (payload.modelType === PAYMENT_MODEL_TYPE.Order) {
    const order = await Order.findById(payload.reference).lean().exec();
    if (!order) throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
    return { referenceDoc: order, price: order.totalPrice };
  }

  if (payload.modelType === PAYMENT_MODEL_TYPE.Booking) {
    const booking = await Booking.findById(payload.reference).lean().exec();
    if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
    const price =
      booking.paymentType === 'half' ? booking.price / 2 : booking.price;
    return { referenceDoc: booking, price };
  }

  throw new AppError(httpStatus.BAD_REQUEST, 'Invalid model type');
};

// 🔹 Helper → upsert pending payment record
export const upsertPendingPayment = async (
  payload: TPayment,
  price: number,
  session: any,
) => {
  const trnId = generateTrxId();
  const { adminAmount, vendorAmount } = calculateAmounts(price);

  const existing = await Payment.findOne({
    reference: payload.reference,
    modelType: payload.modelType,
    status: 'pending',
    isDeleted: false,
  }).session(session);

  if (existing) {
    existing.trnId = trnId;
    existing.price = price;
    existing.adminAmount = adminAmount;
    existing.vendorAmount = vendorAmount;
    await existing.save({ session });
    return existing;
  }

  const [created] = await Payment.create(
    [
      {
        user: payload.user,
        vendor: payload.vendor,
        modelType: payload.modelType,
        reference: payload.reference,
        trnId,
        price,
        adminAmount,
        vendorAmount,
      },
    ],
    { session },
  );

  if (!created)
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment creation failed');
  return created;
};

// 🔹 Helper → get or create Stripe customer
export const resolveStripeCustomer = async (userId: string, session: any) => {
  const user = await User.findById(userId).session(session);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await StripePaymentService.createCustomer(
    user.email!,
    user.fullName!,
  );
  await User.findByIdAndUpdate(user._id, {
    stripeCustomerId: customer.id,
  }).session(session);

  return customer.id;
};

// 🔹 Helper → resolve vendor Stripe connected account
export const resolveVendorStripeAccount = async (
  vendorId: string,
  session: any,
) => {
  const vendor = await Vendor.findById(vendorId)
    .session(session)
    .select('userId');
  if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

  const vendorUser = await User.findById(vendor.userId)
    .session(session)
    .select('stripeAccountId');
  if (!vendorUser)
    throw new AppError(httpStatus.NOT_FOUND, 'Vendor user not found');

  if (!vendorUser.stripeAccountId)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Vendor has not completed Stripe onboarding',
    );
  return vendorUser.stripeAccountId;
};

// 🔹 Helper → build Stripe line items
export const buildLineItems = (
  modelType: string,
  referenceDoc: any,
  price: number,
) => {
  if (modelType === PAYMENT_MODEL_TYPE.Order) {
    return referenceDoc.products.map((p: any) => ({
      price_data: {
        currency: config.currency,
        product_data: { name: p.name || 'Product' },
        unit_amount: Math.round(Number(p.price) * 100),
      },
      quantity: Number(p.quantity) || 1,
    }));
  }

  return [
    {
      price_data: {
        currency: config.currency,
        product_data: {
          name: referenceDoc.serviceName || 'Service Booking',
        },
        unit_amount: Math.round(price * 100),
      },
      quantity: 1,
    },
  ];
};
