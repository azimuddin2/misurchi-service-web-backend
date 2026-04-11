import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { Booking } from './booking.model';
import { Packages } from '../packages/packages.model';
import { TBooking } from './booking.interface';
import { TWeekDay } from '../packages/packages.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { bookingSearchableFields } from './booking.constant';
import { NotificationServices } from '../notification/notification.service';
import { ModeType } from '../notification/notification.interface';
import { generateBookingId } from './booking.utils';

const createBookingIntoDB = async (payload: TBooking) => {
  const { service, serviceItemId, date, time } = payload;

  // Assign backend-specific booking id
  payload.bookingId = generateBookingId();

  // 1️⃣ Validate service ObjectId
  if (!Types.ObjectId.isValid(service))
    throw new AppError(400, 'Invalid service ID');

  // 2️⃣ Past date & time validation
  const [slotStartStr, slotEndStr] = time.split(' - ');

  const parseTimeToMinutes = (str: string) => {
    const [t, modifier] = str.split(' ');
    const [h, m] = t.split(':').map(Number);
    let hours = h + (modifier === 'PM' && h !== 12 ? 12 : 0);
    if (modifier === 'AM' && h === 12) hours = 0;
    return hours * 60 + (m || 0);
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const bookingDateStr = new Date(date).toISOString().split('T')[0];

  // Past date check
  if (bookingDateStr < todayStr) {
    throw new AppError(400, 'Cannot book a past date');
  }

  // Same day — past time check
  if (bookingDateStr === todayStr) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotStart = parseTimeToMinutes(slotStartStr);

    if (slotStart <= currentMinutes) {
      throw new AppError(
        400,
        'Cannot book a time slot that has already passed',
      );
    }
  }

  // 3️⃣ Fetch service
  const serviceData = await Packages.findById(service).lean();
  if (!serviceData) {
    throw new AppError(404, 'Service not found');
  }

  // 4️⃣ Check day schedule
  const dayOfWeek = new Date(date)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase() as TWeekDay;

  const schedule = serviceData.availability?.weeklySchedule?.[dayOfWeek];
  if (!schedule?.enabled) {
    throw new AppError(400, 'Service not available on this day');
  }

  // 5️⃣ Validate slot within schedule
  const slotStartMin = parseTimeToMinutes(slotStartStr);
  const slotEndMin = parseTimeToMinutes(slotEndStr);
  const scheduleStart = parseTimeToMinutes(schedule.startTime);
  const scheduleEnd = parseTimeToMinutes(schedule.endTime);

  if (slotStartMin < scheduleStart || slotEndMin > scheduleEnd) {
    throw new AppError(400, 'Selected time is outside service working hours');
  }

  // 6️⃣ Check if slot is already booked
  const existingBooking = await Booking.findOne({
    service,
    serviceItemId,
    date,
    slotTime: time,
  }).lean();

  if (existingBooking) {
    throw new AppError(409, 'This time slot is already booked');
  }

  // 7️⃣ Create booking
  const booking = await Booking.create(payload);

  // 8️⃣ Send personal notifications
  await NotificationServices.insertNotificationIntoDB({
    receiver: booking.user,
    message: '🎉 Booking Confirmed!',
    description: `Your booking for "${serviceData.name}" is all set for ${date} at ${time}. We look forward to serving you!`,
    reference: booking._id,
    model_type: ModeType.Booking,
  });

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking.vendor,
    message: "📅 You've Got a New Booking!",
    description: `Great news! A new booking for "${serviceData.name}" has been made for ${date} at ${time}. Please be ready to provide your best service.`,
    reference: booking._id,
    model_type: ModeType.Booking,
  });

  return booking;
};

const getAllBookingByUserFromDB = async (query: Record<string, unknown>) => {
  const { vendor, requestType, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted service
  let bookingQuery = Booking.find({ vendor, isDeleted: false })
    .populate('vendor')
    .populate('service');

  // ✅ Custom filter for booking request type (cancel | reschedule)
  if (requestType && ['cancel', 'reschedule'].includes(requestType as string)) {
    bookingQuery = bookingQuery.find({ 'request.type': requestType });
  }

  const queryBuilder = new QueryBuilder(bookingQuery, filters)
    .search(bookingSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getBookingAppointmentsFromDB = async (query: Record<string, unknown>) => {
  const { vendor, date, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query
  const bookingQuery: any = { vendor, isDeleted: false };

  // Filter by date if provided
  if (date) {
    bookingQuery.date = date;
  }

  // Apply other dynamic filters
  Object.assign(bookingQuery, filters);

  // Fetch bookings
  const bookings = await Booking.find(bookingQuery)
    .populate('vendor')
    .populate('service');

  return bookings;
};

const getBookingsByEmailFromDB = async (email: string) => {
  // ✅ Validate email
  if (!email) {
    throw new AppError(400, 'Email is required');
  }

  // ✅ Fetch bookings directly by email
  const bookings = await Booking.find({ email, isDeleted: false })
    .populate('service')
    .populate('vendor')
    .sort({ createdAt: -1 }) // latest first
    .select('-__v -isDeleted'); // exclude unwanted fields

  return bookings;
};

const getBookingByIdFromDB = async (id: string) => {
  const result = await Booking.findById(id).populate('service');

  if (!result) {
    throw new AppError(404, 'This Booking not found');
  }

  if (result.isDeleted === true) {
    throw new AppError(400, 'This Booking has been deleted');
  }

  return result;
};

const updateBookingRequestIntoDB = async (
  bookingId: string,
  payload: TBooking,
) => {
  // 1️⃣ Validate booking ID
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError(400, 'Invalid booking ID');
  }

  // 2️⃣ Fetch existing booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // 3️⃣ Update all provided fields
  for (const key in payload) {
    if (key === 'request') continue; // handle request separately
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      (booking as any)[key] = (payload as any)[key];
    }
  }

  // 4️⃣ Handle request if provided
  if (payload.request) {
    booking.request = {
      ...payload.request,
      vendorApproved: false, // always start as not approved
      updatedAt: new Date(),
    };

    // Optional: auto-update status if cancel request is pre-approved
    if (payload.request.type === 'cancel' && payload.request.vendorApproved) {
      booking.status = 'cancelled';
    }
  }

  // 5️⃣ Save updated booking
  await booking.save();

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking?.user,
    message: '❌ Booking Cancelled',
    description: `Your booking for "${booking.serviceName}" has been successfully cancelled. If you didn't request this or need help, please reach out to our support team.`,
    reference: booking?._id,
    model_type: ModeType.Booking,
  });

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking?.vendor,
    message: '⚠️ A Booking Has Been Cancelled',
    description: `The booking for "${booking.serviceName}" has been cancelled by the user. Please update your availability and check your dashboard for details.`,
    reference: booking?._id,
    model_type: ModeType.Booking,
  });

  return booking;
};

const bookingApprovedRequestIntoDB = async (
  bookingId: string,
  vendorApproved: boolean,
) => {
  // 1️⃣ Find the booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'booking not found');
  }

  // 2️⃣ Check if request exists
  if (!booking.request || booking.request.type === 'none') {
    throw new AppError(400, 'No request submitted for this booking');
  }

  // 3️⃣ Update vendorApproved and updatedAt
  booking.request.vendorApproved = Boolean(vendorApproved);

  // 4️⃣ Save the updated booking
  const updatedBooking = await booking.save();

  // 5️⃣ Notify user based on approval
  if (vendorApproved) {
    await NotificationServices.insertNotificationIntoDB({
      receiver: booking.user,
      message: '✅ Your Request Has Been Approved!',
      description: `Your booking ${booking.serviceName} request (${booking.request.type}) has been approved by the vendor.`,
      reference: booking._id,
      model_type: ModeType.Booking,
    });
  } else {
    await NotificationServices.insertNotificationIntoDB({
      receiver: booking.user,
      message: '❌ Your Request Was Not Approved',
      description: `Your booking ${booking.serviceName} request (${booking.request.type}) has been declined.`,
      reference: booking._id,
      model_type: ModeType.Booking,
    });
  }

  return updatedBooking;
};

const bookingAssignedToMemberIntoDB = async (
  id: string,
  payload: { assignedTo: string },
) => {
  const isBookingExists = await Booking.findById(id);

  if (!isBookingExists) {
    throw new AppError(404, 'This booking is not found');
  }

  // Update assignedTo field (works for add or edit)
  const result = await Booking.findByIdAndUpdate(id, payload, { new: true });

  // await NotificationServices.insertNotificationIntoDB({
  //   receiver: payload.assignedTo,
  //   message: 'New Booking Assigned',
  //   description: `You’ve been assigned to a booking for ${isBookingExists.serviceName}. Please review the details.`,
  //   reference: result?._id,
  //   model_type: ModeType.Booking,
  // });

  return result;
};

const updateBookingStatusIntoDB = async (
  id: string,
  payload: { status: string },
) => {
  const isBookingExists = await Booking.findById(id);

  if (!isBookingExists) {
    throw new AppError(404, 'This booking is not found');
  }

  const result = await Booking.findByIdAndUpdate(id, payload, { new: true });

  await NotificationServices.insertNotificationIntoDB({
    receiver: isBookingExists.user,
    message: `Booking Status Updated`,
    description: `Your booking for ${isBookingExists.serviceName} is now marked as ${payload.status}.`,
    reference: result?._id,
    model_type: ModeType.Booking,
  });

  return result;
};

export const BookingServices = {
  createBookingIntoDB,
  getBookingsByEmailFromDB,
  getBookingByIdFromDB,
  updateBookingRequestIntoDB,
  getAllBookingByUserFromDB,
  getBookingAppointmentsFromDB,
  bookingApprovedRequestIntoDB,
  bookingAssignedToMemberIntoDB,
  updateBookingStatusIntoDB,
};
