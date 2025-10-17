import { Types } from 'mongoose';
import { Booking } from '../booking/booking.model';
import { Order } from '../order/order.model';
import { Payment } from '../payment/payment.model';
import { User } from '../user/user.model';
import { Vendor } from '../vendor/vendor.model';

const getAdminDashboardStats = async () => {
  // 🔹 Total Users
  const totalUsers = await User.countDocuments({ isDeleted: false });

  // 🔹 Total Earnings (vendorAmount)
  const [paymentStats] = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        isDeleted: false,
      },
    },
    {
      $group: { _id: null, total: { $sum: '$vendorAmount' } },
    },
  ]);

  const totalIncome = paymentStats?.total || 0;

  return {
    totalUsers,
    totalIncome,
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

export const DashboardService = {
  getAdminDashboardStats,
  getVendorDashboardStats,
  getVendorSalesOverviewChart,
};
