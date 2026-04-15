import mongoose, { PipelineStage } from 'mongoose';
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
  console.log(query);
  const {
    minPrice,
    maxPrice,
    minDiscount,
    maxDiscount,
    type,
    recommended,
    isOnSale,
    sortBy,
    sortOrder,
    searchTerm,
    page = 1,
    limit = 9,
  } = query;

  const isSet = (val: unknown) =>
    val !== undefined && String(val).trim() !== '';

  // ── Pagination ──
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const skip = (pageNum - 1) * limitNum;

  // ── Sort ──
  const sortField =
    sortBy === 'rating' ? 'avgRating' : String(sortBy || 'createdAt');
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  // ─────────────────────────────────────────────
  // Step 1: Base $match
  // ─────────────────────────────────────────────
  const baseMatch: Record<string, any> = { isDeleted: false };

  // ✅ type filter (service এ 'type' field)
  if (isSet(type)) {
    const types = String(type)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (types.length > 0) {
      baseMatch.type = {
        $in: types.map((t) => new RegExp(`^${t}$`, 'i')),
      };
    }
  }

  // ✅ recommended filter → DB field: "recommendedType" (array)
  if (isSet(recommended)) {
    const recs = String(recommended)
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    if (recs.length > 0) {
      baseMatch.recommendedType = {
        $in: recs.map((r) => new RegExp(`^${r}$`, 'i')),
      };
    }
  }

  // ✅ Special Offer → savedServices[0].discount must exist
  if (isOnSale === 'true' || isOnSale === true) {
    baseMatch['savedServices'] = {
      $elemMatch: {
        discount: {
          $exists: true,
          $nin: [null, '', 'none', '0'],
          $ne: 'none',
        },
      },
    };
  }

  // searchTerm filter
  if (isSet(searchTerm)) {
    const regex = new RegExp(String(searchTerm), 'i');
    baseMatch.$or = packageSearchableFields.map((field) => ({
      [field]: { $regex: regex },
    }));
  }

  // ─────────────────────────────────────────────
  // Step 2: Computed fields (only when needed)
  // ─────────────────────────────────────────────
  const hasPriceFilter = isSet(minPrice) || isSet(maxPrice);
  const hasDiscountFilter = isSet(minDiscount) || isSet(maxDiscount);
  const needsComputed = hasPriceFilter || hasDiscountFilter;

  // ✅ savedServices[0] থেকে price/discount নেওয়া
  const firstServiceField = (field: string) => ({
    $getField: {
      field,
      input: { $arrayElemAt: ['$savedServices', 0] },
    },
  });

  const addComputedFields: PipelineStage = {
    $addFields: {
      _calcPrice: {
        $toDouble: firstServiceField('price'),
      },
      _calcDiscount: {
        $cond: {
          if: {
            $in: [firstServiceField('discount'), ['none', '', null]],
          },
          then: 0,
          else: {
            $toInt: {
              $replaceAll: {
                input: firstServiceField('discount'),
                find: '%',
                replacement: '',
              },
            },
          },
        },
      },
    },
  };

  // ─────────────────────────────────────────────
  // Step 3: Second $match (on computed fields)
  // ─────────────────────────────────────────────
  const computedMatch: Record<string, any> = {};

  if (hasPriceFilter) {
    computedMatch._calcPrice = {};
    if (isSet(minPrice)) computedMatch._calcPrice.$gte = Number(minPrice);
    if (isSet(maxPrice)) computedMatch._calcPrice.$lte = Number(maxPrice);
  }

  if (hasDiscountFilter) {
    computedMatch._calcDiscount = {};
    if (isSet(minDiscount))
      computedMatch._calcDiscount.$gte = Number(minDiscount);
    if (isSet(maxDiscount))
      computedMatch._calcDiscount.$lte = Number(maxDiscount);
  }

  // ─────────────────────────────────────────────
  // Sensitive fields strip
  // ─────────────────────────────────────────────
  const SENSITIVE_FIELDS = [
    'password',
    'confirmPassword',
    'needsPasswordChange',
  ];

  const stripSensitiveFields = (inputVar: string) => ({
    $arrayToObject: {
      $filter: {
        input: { $objectToArray: inputVar },
        as: 'field',
        cond: {
          $not: { $in: ['$$field.k', SENSITIVE_FIELDS] },
        },
      },
    },
  });

  // ─────────────────────────────────────────────
  // Build Pipeline
  // ─────────────────────────────────────────────
  const pipeline: PipelineStage[] = [
    { $match: baseMatch },

    ...(needsComputed ? [addComputedFields] : []),
    ...(needsComputed && Object.keys(computedMatch).length > 0
      ? [{ $match: computedMatch } as PipelineStage]
      : []),

    // Join vendor
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendor',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    {
      $addFields: {
        vendor: {
          $arrayElemAt: [
            {
              $map: {
                input: '$vendor',
                as: 'v',
                in: stripSensitiveFields('$$v'),
              },
            },
            0,
          ],
        },
      },
    },

    // Join user
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $addFields: {
        user: {
          $arrayElemAt: [
            {
              $map: {
                input: '$user',
                as: 'u',
                in: stripSensitiveFields('$$u'),
              },
            },
            0,
          ],
        },
        _calcPrice: '$$REMOVE',
        _calcDiscount: '$$REMOVE',
      },
    },

    { $sort: { [sortField]: sortDir } },

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limitNum }],
        totalCount: [{ $count: 'total' }],
      },
    },
  ];

  const [facetResult] = await Packages.aggregate(pipeline);

  const result = facetResult?.data || [];
  const total = facetResult?.totalCount?.[0]?.total || 0;
  const totalPage = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPage,
      totalDoc: total,
    },
    result,
  };
};

const getAllPackagesByVendorFromDB = async (query: Record<string, unknown>) => {
  const { vendorId, ...filters } = query;

  if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted packages service
  let packagesQuery = Packages.find({ vendor: vendorId, isDeleted: false })
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
  getAllPackagesByVendorFromDB,
  getPackagesByIdFromDB,
  updatePackagesIntoDB,
  deletePackagesFromDB,
  updatePackagesStatusIntoDB,
  updatePackagesHighlightStatusIntoDB,
  getAvailabilityFromDB,
};
