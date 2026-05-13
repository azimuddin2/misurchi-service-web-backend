import mongoose, { startSession } from 'mongoose';
import { TPayment } from './payment.interface';
import { Order } from '../order/order.model';
import { Booking } from '../booking/booking.model';
import { Payment } from './payment.model';
import { User } from '../user/user.model';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
import StripePaymentService from '../../class/stripe';
import { Product } from '../product/product.model';
import { PAYMENT_STATUS, paymentSearchableFields } from './payment.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import {
  buildLineItems,
  resolveReferenceDoc,
  resolveStripeCustomer,
  resolveVendorStripeAccount,
  upsertPendingPayment,
} from './payment.utils';
import { NotificationServices } from '../notification/notification.service';
import { ModeType } from '../notification/notification.interface';

const createPayment = async (payload: TPayment) => {
  const session = await startSession();
  session.startTransaction();

  try {
    // STEP 1: Resolve reference doc + price
    const { referenceDoc, price } = await resolveReferenceDoc(payload);
    payload.price = price;

    // STEP 2: Upsert pending payment
    const payment = await upsertPendingPayment(payload, price, session);

    // STEP 3: Resolve Stripe customer
    const customerId = await resolveStripeCustomer(
      payment.user as string,
      session,
    );

    // STEP 4: Resolve vendor Stripe connected account
    const vendorStripeAccountId = await resolveVendorStripeAccount(
      payment.vendor as string,
      session,
    );

    // STEP 5: Build line items
    const lineItems = buildLineItems(payload.modelType, referenceDoc, price);

    // STEP 6: Checkout URLs
    const successUrl = `${config.server_url}/api/v1/payments/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&paymentId=${payment._id}`;
    const cancelUrl = `${config.server_url}/api/v1/payments/cancel?paymentId=${payment._id}`;

    // STEP 7: Create Stripe Checkout Session
    const checkoutSession = await StripePaymentService.getCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl,
      config.currency,
      customerId,
      vendorStripeAccountId, // ✅ transfer to vendor connected account
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

    // ─── Order ───────────────────────────────────────────────
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

      // 🔔 Order Payment Notifications
      await NotificationServices.insertNotificationIntoDB({
        receiver: payment.user,
        message: '💰 Payment Successful!',
        description: `Your payment of $${payment.price} for your order has been confirmed. Your order is now being processed.`,
        reference: payment._id,
        model_type: ModeType.Payment,
      });

      await NotificationServices.insertNotificationIntoDB({
        receiver: payment.vendor,
        message: '💰 Payment Received for an Order',
        description: `A payment of $${payment.vendorAmount} has been received for a new order. Please check your dashboard to start processing.`,
        reference: payment._id,
        model_type: ModeType.Payment,
      });

      // ─── Booking ──────────────────────────────────────────────
    } else if (payment.modelType === 'Booking') {
      const booking = await Booking.findById(payment.reference).session(
        session,
      );
      if (!booking)
        throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

      if (booking.paymentType === 'half') {
        const isFirstPayment = booking.paymentStatus === 'pending';

        if (isFirstPayment) {
          // First 50% payment
          referenceDoc = await Booking.findByIdAndUpdate(
            payment.reference,
            {
              paymentStatus: 'half-paid',
              paidAmount: booking.price / 2,
              remainingAmount: booking.price / 2,
              trnId: payment.trnId,
              $push: { trnIds: payment.trnId },
              isPaid: false,
            },
            { new: true, session },
          );

          // 🔔 Half Payment (First 50%) Notifications
          await NotificationServices.insertNotificationIntoDB({
            receiver: payment.user,
            message: '💳 First Payment Confirmed!',
            description: `Your first payment of $${booking.price / 2} for "${booking.serviceName}" has been received. Please complete the remaining $${booking.price / 2} to fully confirm your booking.`,
            reference: payment._id,
            model_type: ModeType.Payment,
          });

          await NotificationServices.insertNotificationIntoDB({
            receiver: payment.vendor,
            message: '💰 First Half Payment Received',
            description: `A partial payment of $${booking.price / 2} has been made for "${booking.serviceName}". The remaining balance of $${booking.price / 2} is still pending.`,
            reference: payment._id,
            model_type: ModeType.Payment,
          });
        } else {
          // Second 50% payment
          referenceDoc = await Booking.findByIdAndUpdate(
            payment.reference,
            {
              status: 'pending',
              paymentStatus: 'paid',
              paidAmount: booking.price,
              remainingAmount: 0,
              trnId: payment.trnId,
              $push: { trnIds: payment.trnId },
              isPaid: true,
            },
            { new: true, session },
          );

          // 🔔 Half Payment (Final 50%) Notifications
          await NotificationServices.insertNotificationIntoDB({
            receiver: payment.user,
            message: '🎉 Booking Fully Paid & Confirmed!',
            description: `Your final payment of $${booking.price / 2} for "${booking.serviceName}" has been received. Your booking is now fully confirmed. We look forward to serving you!`,
            reference: payment._id,
            model_type: ModeType.Payment,
          });

          await NotificationServices.insertNotificationIntoDB({
            receiver: payment.vendor,
            message: '💰 Full Payment Received — Booking Confirmed',
            description: `The final payment of $${booking.price / 2} for "${booking.serviceName}" has been completed. The booking is now fully confirmed. Please be ready to deliver your best service!`,
            reference: payment._id,
            model_type: ModeType.Payment,
          });
        }
      } else {
        // Full / later payment
        referenceDoc = await Booking.findByIdAndUpdate(
          payment.reference,
          {
            status: 'pending',
            paymentStatus: 'paid',
            paidAmount: booking.price,
            remainingAmount: 0,
            trnId: payment.trnId,
            $push: { trnIds: payment.trnId },
            isPaid: true,
          },
          { new: true, session },
        );

        // 🔔 Full Payment Notifications
        await NotificationServices.insertNotificationIntoDB({
          receiver: payment.user,
          message: '🎉 Payment Successful — Booking Confirmed!',
          description: `Your full payment of $${booking.price} for "${booking.serviceName}" has been received. Your booking is confirmed and we can't wait to serve you!`,
          reference: payment._id,
          model_type: ModeType.Payment,
        });

        await NotificationServices.insertNotificationIntoDB({
          receiver: payment.vendor,
          message: '💰 Full Payment Received — Booking Confirmed',
          description: `A full payment of $${payment.vendorAmount} has been received for "${booking.serviceName}". The booking is confirmed — please prepare accordingly.`,
          reference: payment._id,
          model_type: ModeType.Payment,
        });
      }
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

const cancelPayment = async (paymentId: string) => {
  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId))
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid paymentId');

  const session = await startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
    if (payment.status === 'paid')
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Cannot cancel a paid deposit',
      );

    payment.status = 'cancelled';
    await payment.save({ session });

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getAllPaymentFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  //✅ If searchTerm is present, find matching user IDs based on email or fullName
  let matchingUserIds: any = [];
  if (filters.searchTerm) {
    const matchingUsers = await User.find({
      $or: [
        { email: { $regex: filters.searchTerm, $options: 'i' } },
        { fullName: { $regex: filters.searchTerm, $options: 'i' } },
      ],
    }).select('_id');
    matchingUserIds = matchingUsers.map((u) => u._id);
  }

  const paymentQuery = Payment.find({ vendor, isDeleted: false })
    .populate('vendor', 'businessName email')
    .populate('user', 'fullName email phone image role')
    .populate({
      path: 'reference',
      select:
        'orderId bookingId products serviceName date time duration price status',
    });

  const queryBuilder = new QueryBuilder(paymentQuery, filters)
    .search(paymentSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  // ✅ user ids filtering logic
  if (matchingUserIds.length > 0) {
    const existing$or = (queryBuilder.finalFilter.$or as any[]) || [];
    queryBuilder.finalFilter.$or = [
      ...existing$or,
      { user: { $in: matchingUserIds } },
    ];
    // ✅ updated filter application to the query
    queryBuilder.modelQuery = queryBuilder.modelQuery.find({
      ...queryBuilder.finalFilter,
    });
  }

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getAllPaymentByAdminFromDB = async (query: Record<string, unknown>) => {
  const { ...filters } = query;

  // Base query -> always exclude deleted payments
  let paymentQuery = Payment.find({ isDeleted: false, status: 'paid' })
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
  cancelPayment,
  getAllPaymentFromDB,
  getAllPaymentByAdminFromDB,
};
