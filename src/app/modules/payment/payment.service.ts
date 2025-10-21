import mongoose, { startSession } from 'mongoose';
import { PAYMENT_MODEL_TYPE, TPayment } from './payment.interface';
import { Order } from '../order/order.model';
import { Booking } from '../booking/booking.model';
import { Payment } from './payment.model';
import { User } from '../user/user.model';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import StripePaymentService from '../../class/stripe';
import { Product } from '../product/product.model';
import { PAYMENT_STATUS } from './payment.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import { generateTrxId } from './payment.utils';

// 🔹 Helper → calculate commission split (10% admin, 90% vendor)
const calculateAmounts = (price: number) => ({
  adminAmount: price * 0.1,
  vendorAmount: price * 0.9,
});

const createPayment = async (payload: TPayment) => {
  const session = await startSession();
  session.startTransaction();

  try {
    let referenceDoc: any;

    // STEP 1: Fetch Order or Booking
    if (payload.modelType === PAYMENT_MODEL_TYPE.Order) {
      referenceDoc = await Order.findById(payload.reference).lean().exec();
      if (!referenceDoc)
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
      payload.price = referenceDoc.totalPrice;
    } else if (payload.modelType === PAYMENT_MODEL_TYPE.Booking) {
      referenceDoc = await Booking.findById(payload.reference).lean().exec();
      if (!referenceDoc)
        throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
      payload.price =
        referenceDoc.paymentType === 'half'
          ? referenceDoc.price / 2
          : referenceDoc.price;
    }

    // STEP 2: Reuse or Create Payment
    const trnId = generateTrxId();
    let payment = await Payment.findOne({
      reference: payload.reference,
      modelType: payload.modelType,
      status: 'pending',
      isDeleted: false,
    }).session(session);

    const { adminAmount, vendorAmount } = calculateAmounts(payload.price);

    if (payment) {
      payment.trnId = trnId;
      payment.price = payload.price;
      payment.adminAmount = adminAmount;
      payment.vendorAmount = vendorAmount;
      await payment.save({ session });
    } else {
      payment = await Payment.create(
        [
          {
            user: payload.user,
            vendor: payload.vendor,
            modelType: payload.modelType,
            reference: payload.reference,
            trnId,
            price: payload.price,
            adminAmount,
            vendorAmount,
          },
        ],
        { session },
      ).then((docs) => docs[0]);
    }

    if (!payment)
      throw new AppError(httpStatus.BAD_REQUEST, 'Payment creation failed');

    // STEP 3: Stripe Customer
    const user = await User.findById(payment.user).session(session);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await StripePaymentService.createCustomer(
        user.email!,
        user.fullName!,
      );
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      }).session(session);
    }

    // STEP 4: Vendor Stripe Connect Account
    // const vendor = await Vendor.findById(payment.vendor).session(session);
    // if (!vendor) throw new AppError(httpStatus.NOT_FOUND, 'Vendor not found');

    // let vendorAccountId = vendor.stripeAccountId;
    // if (!vendorAccountId) {
    //   const connectAccount = await StripePaymentService.createConnectAccount(
    //     vendor.email!,
    //   );
    //   vendorAccountId = connectAccount.id;
    //   await User.findByIdAndUpdate(vendor._id, {
    //     stripeAccountId: vendorAccountId,
    //   }).session(session);

    //   // Optional: send onboarding link
    //   const accountLink =
    //     await StripePaymentService.generateAccountLink(vendorAccountId);
    //   return { onboardingUrl: accountLink.url };
    // }

    // STEP 5: Prepare Stripe line items
    const lineItems: any[] = [];
    if (payload.modelType === PAYMENT_MODEL_TYPE.Order) {
      referenceDoc.products.forEach((p: any) => {
        lineItems.push({
          price_data: {
            currency: config.currency,
            product_data: { name: p.name || 'Product' },
            unit_amount: Math.round(Number(p.price) * 100),
          },
          quantity: Number(p.quantity) || 1,
        });
      });
    } else {
      lineItems.push({
        price_data: {
          currency: config.currency,
          product_data: { name: referenceDoc.serviceName || 'Service Booking' },
          unit_amount: Math.round(payload.price * 100),
        },
        quantity: 1,
      });
    }

    // STEP 6: Checkout URLs
    const successUrl = `${config.server_url}/payments/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payment._id}`;
    const cancelUrl = `${config.server_url}/payments/cancel?paymentId=${payment._id}`;

    // STEP 7: Create Stripe Checkout Session (Destination Charge)
    const checkoutSession = await StripePaymentService.getCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl,
      config.currency,
      customerId,
      // vendorAccountId, // ✅ Vendor’s connected account
    );

    await session.commitTransaction();
    return checkoutSession?.url;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const confirmPayment = async (query: Record<string, any>) => {
  const { sessionId, paymentId } = query;
  const session = await startSession();

  try {
    const paymentSession =
      await StripePaymentService.getPaymentSession(sessionId);
    const paymentIntentId = paymentSession.payment_intent as string;

    const isPaid = await StripePaymentService.isPaymentSuccess(sessionId);
    if (!isPaid)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Payment session is not completed',
      );

    session.startTransaction();

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: PAYMENT_STATUS.paid, paymentIntentId },
      { new: true, session },
    ).populate([
      { path: 'user', select: 'name _id email phoneNumber profile' },
      { path: 'vendor', select: 'name _id email phoneNumber profile' },
    ]);

    if (!payment) throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');

    let referenceDoc: any;
    if (payment.modelType === 'Order') {
      referenceDoc = await Order.findByIdAndUpdate(
        payment.reference,
        { trnId: payment.trnId, isPaid: true },
        { new: true, session },
      );

      for (const p of referenceDoc.products) {
        await Product.findByIdAndUpdate(
          p.product,
          { $inc: { stock: -p.quantity, totalSell: p.quantity } },
          { session },
        );
      }
    } else if (payment.modelType === 'Booking') {
      referenceDoc = await Booking.findByIdAndUpdate(
        payment.reference,
        { status: 'confirmed', trnId: payment.trnId, isPaid: true },
        { new: true, session },
      );
    }

    await User.findByIdAndUpdate(
      payment.vendor,
      { $inc: { balance: payment.vendorAmount } },
      { session },
    );

    await session.commitTransaction();
    return payment;
  } catch (error: any) {
    await session.abortTransaction();
    if (sessionId) {
      try {
        await StripePaymentService.refund(sessionId);
      } catch (refundError: any) {
        console.error('Refund error:', refundError.message);
      }
    }
    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  } finally {
    session.endSession();
  }
};

const getAllPaymentFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted payments
  let paymentQuery = Payment.find({ vendor, isDeleted: false })
    .populate('vendor', 'businessName email')
    .populate('user')
    .populate({
      path: 'reference',
      select: 'orderId bookingId',
    });

  const queryBuilder = new QueryBuilder(paymentQuery, filters)
    .search([''])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

export const PaymentService = {
  createPayment,
  confirmPayment,
  getAllPaymentFromDB,
};
