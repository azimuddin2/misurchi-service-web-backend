import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { Payment } from '../payment/payment.model';
import SubPayment from '../subPayment/sub-payment.module';

const getSalesTaxSummaryFromDB = async (vendorId: string) => {
  if (!vendorId || !Types.ObjectId.isValid(vendorId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Vendor ID');
  }

  // Step 1: Sales payment aggregate by year
  const salesResult = await Payment.aggregate([
    {
      $match: {
        vendor: new Types.ObjectId(vendorId),
        status: 'paid',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' } },
        totalSalesRevenue: { $sum: '$price' },
        platformFees: { $sum: '$adminAmount' },
        netPayouts: { $sum: '$vendorAmount' },
        refundIssue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'refunded'] }, '$price', 0],
          },
        },
      },
    },
    { $sort: { '_id.year': -1 } },
  ]);

  // Step 2: Subscription fees paid — group by year
  const subFeesResult = await SubPayment.aggregate([
    {
      $match: {
        vendor: new Types.ObjectId(vendorId),
        isPaid: true,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: { year: { $year: '$paidAt' } },
        totalSubscriptionFees: { $sum: '$amount' },
      },
    },
  ]);

  // Step 3: Latest plan name per year
  const subPlanResult = await SubPayment.aggregate([
    {
      $match: {
        vendor: new Types.ObjectId(vendorId),
        isPaid: true,
        isDeleted: false,
      },
    },
    { $sort: { paidAt: -1 } },
    {
      $group: {
        _id: { year: { $year: '$paidAt' } },
        planId: { $first: '$plan' },
      },
    },
    {
      $lookup: {
        from: 'plans',
        localField: 'planId',
        foreignField: '_id',
        as: 'planInfo',
      },
    },
    {
      $unwind: { path: '$planInfo', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        planName: { $ifNull: ['$planInfo.name', 'Basic Plan'] },
      },
    },
  ]);

  // Step 4: Map by year
  const subFeesByYear = new Map<number, number>();
  subFeesResult.forEach((item) => {
    subFeesByYear.set(item._id.year, item.totalSubscriptionFees);
  });

  const planNameByYear = new Map<number, string>();
  subPlanResult.forEach((item) => {
    planNameByYear.set(item.year, item.planName);
  });

  // Step 5: Merge sales + subscription data
  const result = salesResult.map((item) => {
    const year = item._id.year;
    const subscriptionFeesPaid = subFeesByYear.get(year) ?? 0;
    const planName = planNameByYear.get(year) ?? 'Basic Plan';

    return {
      year,
      totalSalesRevenue: Math.round(item.totalSalesRevenue * 100) / 100,
      platformFees: Math.round(item.platformFees * 100) / 100,
      netPayouts: Math.round(item.netPayouts * 100) / 100,
      subscriptionFeesPaid: Math.round(subscriptionFeesPaid * 100) / 100,
      planName,
      refundIssue: Math.round(item.refundIssue * 100) / 100,
      payoutDatesAndMethods:
        '1st and 15th of each month via PayPal and Bank Transfer',
    };
  });

  return result;
};

const getSubscriptionTaxSummaryFromDB = async (vendorId: string) => {
  if (!vendorId || !Types.ObjectId.isValid(vendorId)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid Vendor ID');
  }

  const result = await SubPayment.aggregate([
    {
      $match: {
        vendor: new Types.ObjectId(vendorId),
        isPaid: true,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: 'plans',
        localField: 'plan',
        foreignField: '_id',
        as: 'planInfo',
      },
    },
    {
      $unwind: {
        path: '$planInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: 'subscription',
        foreignField: '_id',
        as: 'subscriptionInfo',
      },
    },
    {
      $unwind: {
        path: '$subscriptionInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { paidAt: -1 },
    },
    {
      $project: {
        _id: 1,
        planName: { $ifNull: ['$planInfo.name', 'Basic Plan'] },
        amount: { $round: ['$amount', 2] },
        durationType: 1,
        tranId: 1,
        paidAt: 1,
        startDate: '$subscriptionInfo.startDate',
        expirationDate: '$subscriptionInfo.endDate',
        planStatus: '$subscriptionInfo.status',
        refundIssue: { $literal: 0 },
        payoutDatesAndMethods: {
          $literal: '1st and 15th of each month via Bank Transfer',
        },
      },
    },
  ]);

  return result;
};

export const TaxSummaryService = {
  getSalesTaxSummaryFromDB,
  getSubscriptionTaxSummaryFromDB,
};
