import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
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

export const DashboardService = {
  getAdminDashboardStats,
  getAdminUserOverviewChart,
  getAdminEarningOverviewChart,
};
