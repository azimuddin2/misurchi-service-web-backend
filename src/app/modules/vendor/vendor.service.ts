import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { deleteFromS3, uploadToS3 } from '../../utils/awsS3FileUploader';
import { User } from '../user/user.model';
import { TDashboardStats, TVendor } from './vendor.interface';
import { Vendor } from './vendor.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { vendorSearchableFields } from './vendor.constant';
import { Product } from '../product/product.model';
import { Packages } from '../packages/packages.model';
import { Payment } from '../payment/payment.model';
import { Booking } from '../booking/booking.model';
import { Order } from '../order/order.model';
import { calcChangePercent } from './vendor.utils';

const getAllVendorsFromDB = async (query: Record<string, unknown>) => {
  const { topRated, ...restQuery } = query;

  const vendorQuery = new QueryBuilder(Vendor.find(), restQuery)
    .search(vendorSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  if (topRated === 'true') {
    vendorQuery.modelQuery = vendorQuery.modelQuery
      .where('avgRating')
      .gte(4)
      .sort({ avgRating: -1 });
  }

  const meta = await vendorQuery.countTotal();
  const result = await vendorQuery.modelQuery;

  return { meta, result };
};

const getVendorProfileFromDB = async (email: string) => {
  const result = await Vendor.findOne({ email: email }).populate('userId');
  return result;
};

const getVendorUserByIdFromDB = async (id: string) => {
  const result = await Vendor.findById(id).populate('userId');
  return result;
};

const updateVendorProfileIntoDB = async (
  email: string,
  payload: Partial<TVendor>,
  profileFile?: Express.Multer.File,
  coverFile?: Express.Multer.File,
) => {
  // 🔍 Step 1: Check if vendor exists & get userId
  const existingVendor = await Vendor.findOne({ email }).select(
    'userId image coverImage',
  );
  if (!existingVendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 📸 Step 2: Handle profile image upload
    if (profileFile) {
      const uploadedProfileUrl = await uploadToS3({
        file: profileFile,
        fileName: `images/user/profile/${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`,
      });
      if (existingVendor.image) await deleteFromS3(existingVendor.image);
      payload.image = uploadedProfileUrl as string;
    }

    // 📸 Step 3: Handle cover image upload
    if (coverFile) {
      const uploadedCoverUrl = await uploadToS3({
        file: coverFile,
        fileName: `images/user/cover/${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`,
      });
      if (existingVendor.coverImage)
        await deleteFromS3(existingVendor.coverImage);
      payload.coverImage = uploadedCoverUrl as string;
    }

    // ✅ Location dot notation এ convert
    const { location, ...restPayload } = payload as any;

    const updateData: Record<string, any> = { ...restPayload };

    if (location?.coordinates?.length === 2) {
      updateData['location.type'] = 'Point';
      updateData['location.coordinates'] = location.coordinates;
      updateData['location.streetAddress'] = location.streetAddress || '';
    }

    // 📝 Step 4: Update linked User
    const updatedUser = await User.findByIdAndUpdate(
      existingVendor.userId,
      { $set: updateData },
      { new: true, runValidators: true, session },
    );
    if (!updatedUser) {
      throw new AppError(400, 'Failed to update Vendor');
    }

    // 📝 Step 5: Update Vendor
    const updatedVendor = await Vendor.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true, session },
    );
    if (!updatedVendor) {
      throw new AppError(400, 'Failed to update vendor');
    }

    // ✅ Step 6: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedVendor;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'Vendor profile update failed');
  }
};

const chooseOfferIntoDB = async (
  id: string,
  payload: { chooseOffer: string },
) => {
  const result = await Vendor.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const getVendorSummaryFromDB = async (vendorId: string) => {
  // 1️⃣ Check vendor existence
  const vendorExists = await Vendor.findById({
    _id: vendorId,
    isDeleted: false,
  });

  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);

  // 2️⃣ Total products count
  const totalProducts = await Product.countDocuments({
    vendor: vendorObjectId,
    isDeleted: false,
  });

  // 3️⃣ Total services count
  const totalServices = await Packages.countDocuments({
    vendor: vendorObjectId,
    isDeleted: false,
  });

  // 4️⃣ Total earnings from Payment collection
  const earningsData = await Payment.aggregate([
    {
      $match: {
        vendor: vendorObjectId,
        status: 'paid',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$vendorAmount' },
      },
    },
  ]);

  const totalEarnings = earningsData.length ? earningsData[0].totalEarnings : 0;

  // 5️⃣ Return vendor summary
  return {
    vendorId,
    totalProducts,
    totalServices,
    totalEarnings,
  };
};

const getVendorDashboardStats = async (
  vendorId: string,
): Promise<TDashboardStats> => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);

  // ── Date ranges ──────────────────────────────────────────────────────
  const now = new Date();

  const currentFrom = new Date();
  currentFrom.setDate(now.getDate() - 30);

  const previousTo = new Date();
  previousTo.setDate(now.getDate() - 30);

  const previousFrom = new Date();
  previousFrom.setDate(now.getDate() - 60);

  const currentDateFilter = { $gte: currentFrom, $lte: now };
  const previousDateFilter = { $gte: previousFrom, $lte: previousTo };

  // ── Current period ───────────────────────────────────────────────────
  const [
    currentPendingOrders,
    currentPendingBookings,
    currentTotalBookings,
    currentTransactionsAgg,
  ] = await Promise.all([
    Order.countDocuments({
      vendor: vendorObjectId,
      status: 'pending',
      isDeleted: false,
      createdAt: currentDateFilter,
    }),

    Booking.countDocuments({
      vendor: vendorObjectId,
      status: 'pending',
      isDeleted: false,
      createdAt: currentDateFilter,
    }),

    Booking.countDocuments({
      vendor: vendorObjectId,
      isDeleted: false,
      createdAt: currentDateFilter,
    }),

    Payment.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          status: 'paid',
          isDeleted: false,
          createdAt: currentDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$vendorAmount' } } },
    ]),
  ]);

  // ── Previous period ──────────────────────────────────────────────────
  const [
    prevPendingOrders,
    prevPendingBookings,
    prevTotalBookings,
    prevTransactionsAgg,
  ] = await Promise.all([
    Order.countDocuments({
      vendor: vendorObjectId,
      status: 'pending',
      isDeleted: false,
      createdAt: previousDateFilter,
    }),

    Booking.countDocuments({
      vendor: vendorObjectId,
      status: 'pending',
      isDeleted: false,
      createdAt: previousDateFilter,
    }),

    Booking.countDocuments({
      vendor: vendorObjectId,
      isDeleted: false,
      createdAt: previousDateFilter,
    }),

    Payment.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          status: 'paid',
          isDeleted: false,
          createdAt: previousDateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$vendorAmount' } } },
    ]),
  ]);

  // ── Compute results ──────────────────────────────────────────────────
  const currentTransactions = currentTransactionsAgg[0]?.total ?? 0;
  const prevTransactions = prevTransactionsAgg[0]?.total ?? 0;

  return {
    totalTransactions: {
      count: currentTransactions,
      changePercent: calcChangePercent(currentTransactions, prevTransactions),
    },
    totalBookings: {
      count: currentTotalBookings,
      changePercent: calcChangePercent(currentTotalBookings, prevTotalBookings),
    },
    pendingOrders: {
      count: currentPendingOrders,
      changePercent: calcChangePercent(currentPendingOrders, prevPendingOrders),
    },
    pendingBookings: {
      count: currentPendingBookings,
      changePercent: calcChangePercent(
        currentPendingBookings,
        prevPendingBookings,
      ),
    },
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

const getAppointmentsOverviewRate = async (
  vendorId: string,
  month?: number,
) => {
  const vendorExists = await Vendor.findById(vendorId);
  if (!vendorExists || vendorExists.isDeleted) {
    throw new Error('Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);
  const currentYear = new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth() + 1;

  const startDate = new Date(currentYear, targetMonth - 1, 1);
  const endDate = new Date(currentYear, targetMonth, 0, 23, 59, 59);

  const dateFilter = {
    $gte: startDate,
    $lte: endDate,
  };

  const [bookingStats, orderStats] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          isDeleted: false,
          createdAt: dateFilter,
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
              {
                $round: [
                  { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          vendor: vendorObjectId,
          isDeleted: false,
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0],
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
              {
                $round: [
                  { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]),
  ]);

  return {
    bookings: bookingStats[0] || { total: 0, completed: 0, completionRate: 0 },
    orders: orderStats[0] || { total: 0, completed: 0, completionRate: 0 },
  };
};

const getVendorDashboardDataFromDB = async (vendorId: string) => {
  const vendorExists = await Vendor.findById(vendorId);
  if (!vendorExists || vendorExists.isDeleted) {
    throw new Error('Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);

  const pendingOrdersPromise = Order.find({
    vendor: vendorObjectId,
    status: 'pending',
    isDeleted: false,
  })
    .select('customerName orderId totalPrice status createdAt')
    .sort({ createdAt: -1 })
    .limit(3);

  // todayBookings → pendingBookings
  const pendingBookingsPromise = Booking.find({
    vendor: vendorObjectId,
    status: 'pending',
    isDeleted: false,
  })
    .select('name serviceName time date status createdAt')
    .sort({ createdAt: -1 })
    .limit(3);

  const recentOrdersPromise = Order.find({
    vendor: vendorObjectId,
    isDeleted: false,
  })
    .select('customerName orderId totalPrice status createdAt')
    .sort({ createdAt: -1 })
    .limit(3);

  const recentBookingsPromise = Booking.find({
    vendor: vendorObjectId,
    isDeleted: false,
  })
    .select('name serviceName date time status createdAt')
    .sort({ createdAt: -1 })
    .limit(3);

  const [pendingOrders, pendingBookings, recentOrders, recentBookings] =
    await Promise.all([
      pendingOrdersPromise,
      pendingBookingsPromise,
      recentOrdersPromise,
      recentBookingsPromise,
    ]);

  const recentActivity = [
    ...recentOrders.map((item) => ({
      id: item._id,
      type: 'order',
      orderId: item.orderId,
      name: item.customerName,
      amount: item.totalPrice,
      status: item.status,
      createdAt: item.createdAt,
    })),
    ...recentBookings.map((item) => ({
      id: item._id,
      type: 'booking',
      name: item.name,
      service: item.serviceName,
      date: item.date,
      time: item.time,
      status: item.status,
      createdAt: item.createdAt,
    })),
  ]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  return {
    pendingOrders,
    pendingBookings,
    recentActivity,
  };
};

export const VendorServices = {
  getAllVendorsFromDB,
  getVendorProfileFromDB,
  getVendorUserByIdFromDB,
  updateVendorProfileIntoDB,
  chooseOfferIntoDB,
  getVendorSummaryFromDB,
  getVendorDashboardStats,
  getVendorSalesOverviewChart,
  getAppointmentsOverviewRate,
  getVendorDashboardDataFromDB,
};
