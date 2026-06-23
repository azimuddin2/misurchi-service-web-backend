import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import SubPayment from '../subPayment/sub-payment.module';
import { Months } from './dashboard.constant';
import { calcChangePercent } from '../../utils/calcChangePercent';

const getAdminDashboardStats = async () => {
  // ── Date ranges ──
  const now = new Date();

  const currentFrom = new Date();
  currentFrom.setDate(now.getDate() - 30);

  const previousTo = new Date();
  previousTo.setDate(now.getDate() - 30);

  const previousFrom = new Date();
  previousFrom.setDate(now.getDate() - 60);

  const currentDateFilter = { $gte: currentFrom, $lte: now };
  const previousDateFilter = { $gte: previousFrom, $lte: previousTo };

  // ── 1. Total Users (cumulative growth) ───
  // current total = all users created up to now
  // previous total = all users created up to 30 days ago
  const [totalUsersNow, totalUsersPrev] = await Promise.all([
    User.countDocuments({ isDeleted: false, createdAt: { $lte: now } }),
    User.countDocuments({ isDeleted: false, createdAt: { $lte: previousTo } }),
  ]);

  // ── 2. Vendor Commission Earnings (current vs previous period) ────
  const [currentCommissionAgg, prevCommissionAgg] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          isDeleted: false,
          createdAt: currentDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$adminAmount' } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          isDeleted: false,
          createdAt: previousDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$adminAmount' } } },
    ]),
  ]);

  const currentVendorCommissionEarnings = currentCommissionAgg[0]?.total ?? 0;
  const prevVendorCommissionEarnings = prevCommissionAgg[0]?.total ?? 0;

  // ── 3. Subscription Income (current vs previous period) ──
  const [currentSubIncomeAgg, prevSubIncomeAgg] = await Promise.all([
    SubPayment.aggregate([
      {
        $match: {
          isPaid: true,
          isDeleted: false,
          createdAt: currentDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    SubPayment.aggregate([
      {
        $match: {
          isPaid: true,
          isDeleted: false,
          createdAt: previousDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const currentSubscriptionIncome = currentSubIncomeAgg[0]?.total ?? 0;
  const prevSubscriptionIncome = prevSubIncomeAgg[0]?.total ?? 0;

  // ── 4. Total Subscriptions Count (current vs previous period) ─────
  const [currentSubCount, prevSubCount] = await Promise.all([
    SubPayment.countDocuments({
      isPaid: true,
      isDeleted: false,
      createdAt: currentDateFilter,
    }),
    SubPayment.countDocuments({
      isPaid: true,
      isDeleted: false,
      createdAt: previousDateFilter,
    }),
  ]);

  // ── 5. Total Combined Income ──
  const currentTotalIncome =
    currentVendorCommissionEarnings + currentSubscriptionIncome;
  const prevTotalIncome = prevVendorCommissionEarnings + prevSubscriptionIncome;

  // ── Final Response ──
  return {
    totalUsers: {
      count: totalUsersNow,
      changePercent: calcChangePercent(totalUsersNow, totalUsersPrev),
    },
    totalVendorCommissionEarnings: {
      count: currentVendorCommissionEarnings,
      changePercent: calcChangePercent(
        currentVendorCommissionEarnings,
        prevVendorCommissionEarnings,
      ),
    },
    totalSubscriptionIncome: {
      count: currentSubscriptionIncome,
      changePercent: calcChangePercent(
        currentSubscriptionIncome,
        prevSubscriptionIncome,
      ),
    },
    totalSubscriptions: {
      count: currentSubCount,
      changePercent: calcChangePercent(currentSubCount, prevSubCount),
    },
    totalIncome: {
      count: currentTotalIncome,
      changePercent: calcChangePercent(currentTotalIncome, prevTotalIncome),
    },
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
