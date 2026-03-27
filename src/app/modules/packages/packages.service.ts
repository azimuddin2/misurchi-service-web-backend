import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { UploadedFiles } from '../../interface/common.interface';
import {
  deleteManyFromS3,
  uploadManyToS3,
} from '../../utils/awsS3FileUploader';
import { packageSearchableFields } from './packages.constant';
import { TPackages, TServiceSlots, TSlot } from './packages.interface';
import { Packages } from './packages.model';
import { generateServiceId, generateTimeSlots } from './packages.utils';
import { Booking } from '../booking/booking.model';
import { Vendor } from '../vendor/vendor.model';
import { User } from '../user/user.model';

const createPackagesIntoDB = async (payload: TPackages, files: any) => {
  // Check vendor existence
  const vendorExists = await Vendor.findById({
    _id: payload.vendor,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  // Check user existence
  const userExists = await User.findById({
    _id: payload.user,
    isDeleted: false,
  }).select('role');

  if (!userExists) {
    throw new Error('User not found');
  }

  if (userExists?.role !== 'vendor') {
    throw new AppError(403, 'Only vendor can perform this action');
  }

  // Assign backend-specific service code
  payload.serviceId = generateServiceId();

  // Handle image upload to S3
  if (files) {
    const { images } = files as UploadedFiles;

    if (!images?.length) {
      throw new AppError(404, 'At least one image is required');
    }

    if (images?.length) {
      const imgsArray = images.map((image) => ({
        file: image,
        path: `images/service`,
      }));

      try {
        payload.images = await uploadManyToS3(imgsArray); // Await all uploads before proceeding
      } catch (error) {
        throw new AppError(500, 'Image upload failed');
      }
    }
  }

  const result = await Packages.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create service');
  }

  return result;
};

const getAllPackagesFromDB = async (query: Record<string, unknown>) => {
  const {
    minPrice,
    maxPrice,
    minDiscount,
    maxDiscount,
    type,
    page = 1,
    limit = 10,
    ...restQuery
  } = query;

  // Base filter
  const mongoFilter: Record<string, any> = { isDeleted: false };

  // ✅ Filter by service type
  if (type) {
    const types = String(type)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (types.length > 0) {
      mongoFilter.type = { $in: types.map((t) => new RegExp(t, 'i')) };
    }
  }

  // ✅ Filter by price & discount (savedServices)
  const exprConditions: any[] = [];

  const priceExpr = {
    $cond: [
      { $eq: [{ $type: '$savedServices.price' }, 'string'] },
      { $toDouble: '$savedServices.price' },
      { $ifNull: ['$savedServices.price', 0] },
    ],
  };

  if (minPrice && String(minPrice).trim() !== '') {
    exprConditions.push({ $gte: [priceExpr, Number(minPrice)] });
  }
  if (maxPrice && String(maxPrice).trim() !== '') {
    exprConditions.push({ $lte: [priceExpr, Number(maxPrice)] });
  }

  const discountExpr = {
    $cond: [
      { $regexMatch: { input: '$savedServices.discount', regex: /%/ } },
      {
        $toDouble: {
          $replaceAll: {
            input: { $ifNull: ['$savedServices.discount', '0%'] },
            find: '%',
            replacement: '',
          },
        },
      },
      { $toDouble: { $ifNull: ['$savedServices.discount', 0] } },
    ],
  };

  if (minDiscount && String(minDiscount).trim() !== '') {
    exprConditions.push({ $gte: [discountExpr, Number(minDiscount)] });
  }
  if (maxDiscount && String(maxDiscount).trim() !== '') {
    exprConditions.push({ $lte: [discountExpr, Number(maxDiscount)] });
  }

  // ✅ Run aggregation if price/discount filter exists
  let matchedPackageIds: string[] | null = null;
  if (exprConditions.length > 0) {
    const matchStage = {
      isDeleted: false,
      $expr:
        exprConditions.length === 1
          ? exprConditions[0]
          : { $and: exprConditions },
    };

    const matchedDocs = await Packages.aggregate([
      { $unwind: '$savedServices' },
      { $match: matchStage },
      { $project: { _id: 1 } },
    ]);

    matchedPackageIds = matchedDocs
      .map((d) => d._id?.toString())
      .filter(Boolean);

    if (matchedPackageIds.length === 0) {
      return {
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalDoc: 0,
          totalPage: 0,
        },
        result: [],
      };
    }
  }

  // ✅ Final Mongo filter
  const finalFindFilter: any = {
    ...mongoFilter,
    ...(matchedPackageIds ? { _id: { $in: matchedPackageIds } } : {}),
  };

  // Build query with QueryBuilder (search, sort, pagination, fields)
  const packageQuery = new QueryBuilder(
    Packages.find(finalFindFilter).populate('vendor').populate('user'),
    restQuery,
  )
    .search(packageSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await packageQuery.countTotal();
  const result = await packageQuery.modelQuery;

  return { meta, result };
};

const getAllPackagesByUserFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted packages service
  let packagesQuery = Packages.find({ vendor, isDeleted: false })
    .populate('vendor')
    .populate('user');

  const queryBuilder = new QueryBuilder(packagesQuery, filters)
    .search(packageSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getPackagesByIdFromDB = async (id: string) => {
  const result = await Packages.findById(id)
    .populate('vendor')
    .populate('user')
    .populate({
      path: 'reviews',
      select: '_id rating review user', // include the fields you need
    });

  if (!result) {
    throw new AppError(404, 'This service not found');
  }

  return result;
};

const updatePackagesIntoDB = async (
  id: string,
  payload: Partial<TPackages>,
  files: any,
) => {
  const isPackagesExists = await Packages.findById(id);
  if (!isPackagesExists) throw new AppError(404, 'This service is not found');

  const { deleteKey, images, ...updateData } = payload;

  let uploadedImages: { url: string; key: string }[] = [];

  // ✅ Handle new uploads
  if (files) {
    const { images } = files as UploadedFiles;

    if (images?.length) {
      const imgsArray = images.map((image) => ({
        file: image,
        path: `images/service`,
      }));

      uploadedImages = await uploadManyToS3(imgsArray);
      console.log(uploadedImages, { id }, 'Uploaded to S3 ✅');
    }
  }

  // ✅ Handle deletions
  if (deleteKey && deleteKey.length > 0) {
    const newKey = deleteKey.map((key: any) => `images/service/${key}`);

    await deleteManyFromS3(newKey);
    await Packages.findByIdAndUpdate(
      id,
      { $pull: { images: { key: { $in: deleteKey } } } },
      { new: true },
    );
  }

  // ✅ Add new uploaded images to DB
  if (uploadedImages.length > 0) {
    await Packages.findByIdAndUpdate(
      id,
      { $push: { images: { $each: uploadedImages } } },
      { new: true },
    );
  }

  // ✅ Update other fields
  console.log('UPDATE Data ----------', updateData);
  const result = await Packages.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!result) throw new AppError(400, 'Service update failed');

  return result;
};

const deletePackagesFromDB = async (id: string) => {
  const isPackagesExists = await Packages.findById(id);

  if (!isPackagesExists) {
    throw new AppError(404, 'This service is not found');
  }

  const result = await Packages.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete service');
  }

  return result;
};

const updatePackagesStatusIntoDB = async (
  id: string,
  payload: { status: string },
) => {
  const isPackagesExists = await Packages.findById(id);

  if (!isPackagesExists) {
    throw new AppError(404, 'This service is not found');
  }

  const result = await Packages.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const updatePackagesHighlightStatusIntoDB = async (
  id: string,
  payload: { highlightStatus: string },
) => {
  const isPackagesExists = await Packages.findById(id);

  if (!isPackagesExists) {
    throw new AppError(404, 'This service is not found');
  }

  const result = await Packages.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const getAvailabilityFromDB = async (
  query: Record<string, unknown>,
): Promise<TServiceSlots[]> => {
  // 1️⃣ Extract serviceId and date from query
  const { serviceId, date } = query as { serviceId: string; date: string };
  if (!serviceId || !date) throw new AppError(400, 'Missing serviceId or date');

  // 2️⃣ Fetch the service from DB by serviceId
  const service = await Packages.findOne({ serviceId }).lean();
  if (!service) throw new AppError(404, 'Service not found');

  // 3️⃣ Determine day of the week for the given date (e.g., "monday")
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  // 4️⃣ Get the weekly schedule for that day
  const weeklySchedule = service.availability?.weeklySchedule || {};
  const schedule = weeklySchedule[dayOfWeek as keyof typeof weeklySchedule];

  // 5️⃣ If the service is not enabled on this day, return empty array
  if (!schedule?.enabled) return [];

  const result: TServiceSlots[] = [];

  // 6️⃣ Loop through each saved service (different durations/prices)
  for (const savedService of service.savedServices) {
    // 6a️⃣ Convert duration to minutes
    let slotDuration = 60;
    if (savedService.duration.includes('hr'))
      slotDuration = parseFloat(savedService.duration) * 60;
    else if (savedService.duration.includes('min'))
      slotDuration = parseInt(savedService.duration, 10);

    // 6b️⃣ Generate all possible slots for the day based on start/end times and duration
    const slots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      slotDuration,
    );

    // 6c️⃣ Fetch all bookings for this serviceItemId on the selected date
    const bookedTimesAgg = await Booking.aggregate([
      { $match: { serviceId, date, serviceItemId: savedService.id } },
      { $project: { time: 1, _id: 0 } },
    ]);

    // 6d️⃣ Create a Set of booked slot times for quick lookup
    const bookedTimesSet = new Set(bookedTimesAgg.map((b: any) => b.time));

    // 6e️⃣ Mark slots as 'booked' or 'available'
    const slotsWithStatus: TSlot[] = slots.map((slot) => ({
      ...slot,
      status: bookedTimesSet.has(slot.time) ? 'booked' : 'available',
    }));

    // 6f️⃣ Push the processed service with slots into result
    result.push({
      serviceItemId: savedService.id,
      name: service.name,
      duration: savedService.duration,
      finalPrice: savedService.finalPrice,
      slots: slotsWithStatus,
    });
  }

  // 7️⃣ Return all services with their slots and statuses
  return result;
};

export const PackagesServices = {
  createPackagesIntoDB,
  getAllPackagesFromDB,
  getAllPackagesByUserFromDB,
  getPackagesByIdFromDB,
  updatePackagesIntoDB,
  deletePackagesFromDB,
  updatePackagesStatusIntoDB,
  updatePackagesHighlightStatusIntoDB,
  getAvailabilityFromDB,
};
