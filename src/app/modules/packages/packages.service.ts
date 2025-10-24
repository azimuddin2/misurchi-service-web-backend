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

const createPackagesIntoDB = async (payload: TPackages, files: any) => {
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
  // Extract service type before passing to QueryBuilder
  const { type, ...restQuery } = query;

  // Base query
  let mongoFilter: Record<string, unknown> = { isDeleted: false };

  // ✅ Handle service type filter
  if (type) {
    const types = String(type)
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean)
      .map((type) => new RegExp(type, 'i'));

    mongoFilter.type = { $in: types };
  }

  // 🔧 Pass the rest of the query (pagination, sorting, etc.)
  const serviceQuery = new QueryBuilder(
    Packages.find(mongoFilter).populate('vendor'),
    restQuery,
  )
    .search(packageSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await serviceQuery.countTotal();
  const result = await serviceQuery.modelQuery;

  return { meta, result };
};

const getAllPackagesByUserFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted packages service
  let packagesQuery = Packages.find({ vendor, isDeleted: false }).populate(
    'vendor',
  );

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
  const result = await Packages.findById(id).populate('vendor').populate({
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

  if (!isPackagesExists) {
    throw new AppError(404, 'This service is not found');
  }

  const { deleteKey, ...updateData } = payload; // color isn't used, so removed it

  // Handle image upload to S3
  if (files) {
    const { images } = files as UploadedFiles;

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

  // Handle image deletions (if any)
  if (deleteKey && deleteKey.length > 0) {
    const newKey = deleteKey.map((key: any) => `images/service/${key}`);

    if (newKey.length > 0) {
      await deleteManyFromS3(newKey); // Delete images from S3
      // Remove deleted images from the product
      await Packages.findByIdAndUpdate(
        id,
        {
          $pull: { images: { key: { $in: deleteKey } } },
        },
        { new: true },
      );
    }
  }

  // If new images are provided, push them to the product
  if (payload?.images && payload.images.length > 0) {
    try {
      await Packages.findByIdAndUpdate(
        id,
        { $addToSet: { images: { $each: payload.images } } }, // Push new images to the product
        { new: true },
      );
      delete payload.images; // Remove images from the payload after pushing
    } catch (error) {
      throw new AppError(400, 'Failed to update images');
    }
  }

  // Update other product details
  try {
    const result = await Packages.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!result) {
      throw new AppError(400, 'Service update failed');
    }

    return result;
  } catch (error: any) {
    console.log(error);
    throw new AppError(500, 'Service update failed');
  }
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
