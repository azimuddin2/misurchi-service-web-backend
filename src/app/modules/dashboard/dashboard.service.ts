import { Types } from 'mongoose';
import { Booking } from '../booking/booking.model';
import { Order } from '../order/order.model';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { Vendor } from '../vendor/vendor.model';
import SubPayment from '../subPayment/sub-payment.module';
import { Months } from './dashboard.constant';

const getAdminDashboardStats = async () => {
  // 🔹 1. Total Users
  const totalUsers = await User.countDocuments({ isDeleted: false });

  // 🔹 2. Vendor Commission Earnings (adminAmount from Payment)
  const [vendorCommissionStats] = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        isDeleted: false,
      },
    },
    {
      $group: { _id: null, total: { $sum: '$adminAmount' } },
    },
  ]);

  const totalVendorCommissionEarnings = vendorCommissionStats?.total || 0;

  // 🔹 3. Subscription Payments (from SubPayment model)
  const [subscriptionStats] = await SubPayment.aggregate([
    {
      $match: {
        isPaid: true,
        isDeleted: false,
      },
    },
    {
      $group: { _id: null, total: { $sum: '$amount' } },
    },
  ]);

  const totalSubscriptionIncome = subscriptionStats?.total || 0;

  // 🔹 4. Total Subscription Count
  const totalSubscriptions = await SubPayment.countDocuments({
    isPaid: true,
    isDeleted: false,
  });

  // 🔹 5. Total combined income (vendor commission + subscriptions)
  const totalIncome = totalVendorCommissionEarnings + totalSubscriptionIncome;

  return {
    totalUsers,
    totalVendorCommissionEarnings,
    totalSubscriptionIncome,
    totalSubscriptions,
    totalIncome,
  };
};

const getAdminUserOverviewChart = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();

  // 🧩 Aggregate users by month (creation date)
  const monthlyStats = await User.aggregate([
    {
      $match: {
        isDeleted: false,
        createdAt: {
          $gte: new Date(`${targetYear}-01-01`),
          $lte: new Date(`${targetYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const chartData = Months.map((month, index) => {
    const monthStat = monthlyStats.find((item) => item._id === index + 1);
    return {
      month,
      users: monthStat ? monthStat.count : 0,
    };
  });

  return {
    year: targetYear,
    data: chartData,
  };
};

const getAdminEarningOverviewChart = async (year?: number) => {
  const targetYear = year || new Date().getFullYear();
  const prevYear = targetYear - 1;

  const startDate = new Date(`${targetYear}-01-01T00:00:00Z`);
  const endDate = new Date(`${targetYear}-12-31T23:59:59Z`);

  const startPrevDate = new Date(`${prevYear}-01-01T00:00:00Z`);
  const endPrevDate = new Date(`${prevYear}-12-31T23:59:59Z`);

  // --- Vendor Commission this year ---
  const vendorStatsThisYear = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        isDeleted: false,
        updatedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$updatedAt' } },
        totalVendorCommissionEarnings: { $sum: '$adminAmount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  // --- Subscription this year ---
  const subStatsThisYear = await SubPayment.aggregate([
    {
      $match: {
        isPaid: true,
        isDeleted: false,
        paidAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$paidAt' } },
        totalSubscriptionIncome: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  const chartData = Months.map((month, index) => {
    const vendor = vendorStatsThisYear.find((v) => v._id.month === index + 1);
    const sub = subStatsThisYear.find((s) => s._id.month === index + 1);

    const vendorEarnings = vendor ? vendor.totalVendorCommissionEarnings : 0;
    const subscriptionEarnings = sub ? sub.totalSubscriptionIncome : 0;

    return {
      month,
      vendorEarnings,
      subscriptionEarnings,
      totalEarnings: vendorEarnings + subscriptionEarnings,
    };
  });

  const totalVendorCommissionEarnings = chartData.reduce(
    (sum, m) => sum + m.vendorEarnings,
    0,
  );
  const totalSubscriptionIncome = chartData.reduce(
    (sum, m) => sum + m.subscriptionEarnings,
    0,
  );
  const totalIncomeThisYear =
    totalVendorCommissionEarnings + totalSubscriptionIncome;

  // --- Last Year Totals for yearly growth ---
  const vendorStatsPrevYear = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        isDeleted: false,
        updatedAt: { $gte: startPrevDate, $lte: endPrevDate },
      },
    },
    { $group: { _id: null, total: { $sum: '$adminAmount' } } },
  ]);

  const subStatsPrevYear = await SubPayment.aggregate([
    {
      $match: {
        isPaid: true,
        isDeleted: false,
        paidAt: { $gte: startPrevDate, $lte: endPrevDate },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalIncomePrevYear =
    (vendorStatsPrevYear[0]?.total || 0) + (subStatsPrevYear[0]?.total || 0);

  const yearlyGrowth =
    totalIncomePrevYear !== 0
      ? ((totalIncomeThisYear - totalIncomePrevYear) / totalIncomePrevYear) *
        100
      : totalIncomeThisYear > 0
        ? 100
        : 0; // if both last year and this year = 0

  return {
    year: targetYear,
    totalVendorCommissionEarnings,
    totalSubscriptionIncome,
    totalIncome: totalIncomeThisYear,
    yearlyGrowth: parseFloat(yearlyGrowth.toFixed(2)),
    data: chartData,
  };
};

const getVendorDashboardStats = async (vendorId: string) => {
  // --- Validate vendor existence ---
  const vendorExists = await Vendor.findById({
    _id: vendorId,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);

  // Count pending orders
  const pendingOrdersCountPromise = Order.countDocuments({
    vendor: vendorObjectId,
    status: 'pending',
    isDeleted: false,
  });

  // Count pending bookings
  const pendingBookingsCountPromise = Booking.countDocuments({
    vendor: vendorObjectId,
    status: 'pending',
    isDeleted: false,
  });

  // Count total schedule (pending + confirmed + ongoing bookings)
  const totalScheduleCountPromise = Booking.countDocuments({
    vendor: vendorObjectId,
    status: { $in: ['pending', 'confirmed', 'ongoing'] },
    isDeleted: false,
  });

  // Aggregate total sales
  const totalSalesPromise = Payment.aggregate([
    {
      $match: {
        vendor: vendorObjectId,
        isDeleted: false,
        status: 'paid',
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$vendorAmount' },
      },
    },
  ]);

  // Run in parallel for performance
  const [
    pendingOrdersCount,
    pendingBookingsCount,
    totalScheduleCount,
    totalSalesAgg,
  ] = await Promise.all([
    pendingOrdersCountPromise,
    pendingBookingsCountPromise,
    totalScheduleCountPromise,
    totalSalesPromise,
  ]);

  const totalSales = totalSalesAgg[0]?.totalSales || 0;

  return {
    pendingOrders: pendingOrdersCount,
    pendingBookings: pendingBookingsCount,
    totalSchedule: totalScheduleCount,
    totalSales,
  };
};

const getVendorSalesOverviewChart = async (vendorId: string, year?: number) => {
  // --- Validate vendor existence ---
  const vendor = await Vendor.find({ _id: vendorId, isDeleted: false });
  if (!vendor) throw new Error('Vendor not found');

  const vendorObjectId = new Types.ObjectId(vendorId);
  const targetYear = year || new Date().getFullYear();

  // --- Helper: Format month name ---
  const formatMonth = (index: number) =>
    new Date(0, index).toLocaleString('en', { month: 'short' });

  // --- Monthly chart for full year ---
  const monthlySalesAgg = await Payment.aggregate([
    {
      $match: {
        vendor: vendorObjectId,
        isDeleted: false,
        status: 'paid',
        createdAt: {
          $gte: new Date(targetYear, 0, 1),
          $lt: new Date(targetYear + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalSales: { $sum: '$vendorAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlySales = Array.from({ length: 12 }, (_, i) => {
    const monthData = monthlySalesAgg.find((m) => m._id === i + 1);
    return {
      month: formatMonth(i),
      sales: monthData?.totalSales || 0,
    };
  });

  return {
    type: 'monthly',
    year: targetYear,
    chart: monthlySales,
  };
};

export const getAppointmentsOverviewRate = async (
  vendorId: string,
  month?: number,
) => {
  const vendorObjectId = new Types.ObjectId(vendorId);
  const currentYear = new Date().getFullYear();

  // Use current month if not provided
  const targetMonth = month ?? new Date().getMonth() + 1;

  // Start and end of the month
  const startDate = new Date(currentYear, targetMonth - 1, 1);
  const endDate = new Date(currentYear, targetMonth, 0, 23, 59, 59);

  // Aggregate total + completed bookings
  const stats = await Booking.aggregate([
    {
      $match: {
        vendor: vendorObjectId,
        isDeleted: false,
        date: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        completed: 1,
        completionRate: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
          ],
        },
      },
    },
  ]);

  // Default if no data
  return stats[0] || { total: 0, completed: 0, completionRate: 0 };
};

export const DashboardService = {
  getAdminDashboardStats,
  getAdminUserOverviewChart,
  getAdminEarningOverviewChart,
  getVendorDashboardStats,
  getVendorSalesOverviewChart,
  getAppointmentsOverviewRate,
};
