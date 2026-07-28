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
import {
  generateBookingId,
  isTimeOverlapping,
  parseTimeToMinutes,
  validateTeamMemberForBooking,
} from './booking.utils';
import { TeamMember } from '../teamMember/teamMember.model';
import { sendEmail } from '../../utils/sendEmail';
import {
  bookingCancelledTemplate,
  bookingConfirmedTemplate,
  memberAssignedTemplate,
  requestApprovedTemplate,
  requestRejectedTemplate,
  requestSubmittedTemplate,
  serviceCompletedTemplate,
} from './booking.emailTemplates';

const createBookingIntoDB = async (payload: TBooking) => {
  const { service, serviceItemId, date, time } = payload;

  // 0. Assign backend-specific booking id
  payload.bookingId = generateBookingId();

  // 1️⃣ Validate service ObjectId
  if (!Types.ObjectId.isValid(service))
    throw new AppError(400, 'Invalid service ID');

  // 2️⃣ Past date & time validation
  const [slotStartStr, slotEndStr] = time.split(' - ');

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

  const userExistingBookings = await Booking.find({
    user: payload.user,
    date,
    status: { $ne: 'cancelled' },
  }).lean();

  const conflictingBooking = userExistingBookings.find((b) =>
    isTimeOverlapping(b.time, time),
  );

  if (conflictingBooking) {
    throw new AppError(
      409,
      `Just a heads up — you already have "${conflictingBooking.serviceName}" booked at this time (${conflictingBooking.time}). Please pick a different slot.`,
    );
  }

  // 6️⃣ Check slot availability based on resource capacity (overlap-aware)
  const totalMembers = await TeamMember.countDocuments({
    vendor: serviceData.vendor,
    role: 'team_member',
    isActive: true,
    isDeleted: false,
  });

  const effectiveCapacity = totalMembers > 0 ? totalMembers : 1;

  const allBookingsOnDate = await Booking.find({
    service,
    serviceItemId,
    date,
    status: { $ne: 'cancelled' },
  }).lean();

  if (payload.assignedToMember) {
    const memberConflict = allBookingsOnDate.some(
      (b) =>
        b.assignedToMember?.toString() ===
          payload.assignedToMember?.toString() &&
        isTimeOverlapping(b.time, time),
    );

    if (memberConflict) {
      throw new AppError(
        409,
        'This team member is already booked for this time slot',
      );
    }
  } else {
    const overlappingCount = allBookingsOnDate.filter((b) =>
      isTimeOverlapping(b.time, time),
    ).length;

    if (overlappingCount >= effectiveCapacity) {
      throw new AppError(409, 'This time slot is fully booked');
    }
  }

  // 7️⃣ Validate assigned team member (ownership, active status, double-check)
  if (payload.assignedToMember) {
    await validateTeamMemberForBooking(
      serviceData.vendor as string,
      payload.assignedToMember.toString(),
      date,
      time,
    );
  }

  // 7️⃣ Create booking
  const booking = await Booking.create(payload);

  // 8️⃣ Send personal notifications
  await NotificationServices.insertNotificationIntoDB({
    receiver: booking.user,
    message: '🕓 Booking Received — Payment Pending',
    description: `Your booking for "${serviceData.name}" on ${date} at ${time} has been received and your slot is reserved. Please complete payment soon to confirm it.`,
    reference: booking._id,
    model_type: ModeType.Booking,
  });

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking.vendor,
    message: '📅 New Booking Request — Awaiting Payment',
    description: `A new booking request for "${serviceData.name}" has been made for ${date} at ${time}. It will remain pending until the customer completes payment.`,
    reference: booking._id,
    model_type: ModeType.Booking,
  });

  // 🔔 Notify assigned team member (if selected during booking)
  if (booking.assignedToMember) {
    const assignedMember = await TeamMember.findById(booking.assignedToMember);

    if (assignedMember?.user) {
      await NotificationServices.insertNotificationIntoDB({
        receiver: assignedMember.user,
        message: '📅 You’ve Been Selected for a New Appointment',
        description: `${booking.name} selected you for "${serviceData.name}" on ${date} at ${time}. Please review your upcoming appointment.`,
        reference: booking._id,
        model_type: ModeType.Booking,
      });
    }
  }

  // 9️⃣ Send confirmation email to customer
  const bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const year = new Date().getFullYear();

  await sendEmail(
    booking.email,
    `📋 Booking Received — ${serviceData.name} (Payment Required)`,
    bookingConfirmedTemplate(
      booking,
      serviceData.name,
      bookingDate,
      time,
      year,
    ),
  );

  return booking;
};

const getAllBookingByVendorFromDB = async (query: Record<string, unknown>) => {
  const { vendor, requestType, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted service
  let bookingQuery = Booking.find({ vendor, isDeleted: false })
    .populate({
      path: 'vendor',
      select: 'businessName email phone',
    })
    .populate({
      path: 'service',
      select: 'name images price serviceId',
    });

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
    .populate({
      path: 'vendor',
      select: 'businessName email phone',
    })
    .populate({
      path: 'service',
      select: 'name images price serviceId',
    })
    .populate({
      path: 'assignedToMember',
      select: 'firstName lastName email phone image speciality',
    });

  return bookings;
};

const getBookingsByAssignedMember = async (query: Record<string, unknown>) => {
  const { userId, date, ...filters } = query;

  const teamMember = await TeamMember.findOne({ user: userId });
  const assignedToMember = teamMember?._id;

  if (
    !assignedToMember ||
    !mongoose.Types.ObjectId.isValid(assignedToMember as string)
  ) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query
  const bookingQuery: any = { assignedToMember, isDeleted: false };

  // Filter by date if provided
  if (date) {
    bookingQuery.date = date;
  }

  // Apply other dynamic filters
  Object.assign(bookingQuery, filters);

  // Fetch bookings
  const bookings = await Booking.find(bookingQuery)
    .populate({
      path: 'vendor',
      select: 'businessName email phone',
    })
    .populate({
      path: 'service',
      select: 'name images price serviceId',
    })
    .populate({
      path: 'assignedToMember',
      select: 'firstName lastName email phone image speciality',
    });

  return bookings;
};

const getBookingsByEmailFromDB = async (email: string) => {
  // ✅ Validate email
  if (!email) {
    throw new AppError(400, 'Email is required');
  }

  // ✅ Fetch bookings directly by email
  const bookings = await Booking.find({ email, isDeleted: false })
    .populate({
      path: 'vendor',
      select: 'businessName email phone userId',
      populate: {
        path: 'userId',
        select: '_id fullName email image',
      },
    })
    .populate({
      path: 'service',
      select: 'name images price serviceId',
    })
    .populate({
      path: 'assignedToMember',
      select: 'firstName lastName email phone speciality image',
    })
    .sort({ createdAt: -1 })
    .select('-__v -isDeleted');

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
    if (key === 'request') continue;
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      (booking as any)[key] = (payload as any)[key];
    }
  }

  // 4️⃣ Handle request if provided
  if (payload.request) {
    booking.request = {
      ...payload.request,
      updatedAt: new Date(),
    };

    // Optional: auto-update status if cancel request is pre-approved
    if (payload.request.type === 'cancel' && payload.request.vendorApproved) {
      booking.status = 'cancelled';
    }
  }

  // 5️⃣ Save updated booking
  await booking.save();

  // 6️⃣ Notification — request type
  const requestLabel =
    payload.request?.type === 'cancel' ? 'Cancellation' : 'Reschedule';

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking?.user,
    message: `📋 ${requestLabel} Request Submitted`,
    description: `Your ${requestLabel.toLowerCase()} request for "${booking.serviceName}" has been submitted. Please wait for vendor approval.`,
    reference: booking?._id,
    model_type: ModeType.Booking,
  });

  await NotificationServices.insertNotificationIntoDB({
    receiver: booking?.vendor,
    message: `⚠️ New ${requestLabel} Request`,
    description: `A buyer has requested a ${requestLabel.toLowerCase()} for "${booking.serviceName}". Please review from your dashboard.`,
    reference: booking?._id,
    model_type: ModeType.Booking,
  });

  // 7️⃣ Send email to customer confirming the request was received
  const year = new Date().getFullYear();

  await sendEmail(
    booking.email,
    `📋 ${requestLabel} Request Submitted — ${booking.serviceName}`,
    requestSubmittedTemplate(
      booking,
      requestLabel,
      payload.request?.reason,
      year,
    ),
  );

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

  // 5️⃣ Notify + email user based on approval
  const requestLabel =
    booking.request.type === 'cancel' ? 'Cancellation' : 'Reschedule';
  const year = new Date().getFullYear();

  if (vendorApproved) {
    await NotificationServices.insertNotificationIntoDB({
      receiver: booking.user,
      message: '🎉 Your Request Has Been Approved!',
      description: `Your booking ${booking.serviceName} request (${booking.request.type}) has been approved by the vendor.`,
      reference: booking._id,
      model_type: ModeType.Booking,
    });

    await sendEmail(
      booking.email,
      `✅ ${requestLabel} Request Approved — ${booking.serviceName}`,
      requestApprovedTemplate(booking, requestLabel, year),
    );
  } else {
    await NotificationServices.insertNotificationIntoDB({
      receiver: booking.user,
      message: '❌ Your Request Was Not Approved',
      description: `Your booking ${booking.serviceName} request (${booking.request.type}) has been declined.`,
      reference: booking._id,
      model_type: ModeType.Booking,
    });

    await sendEmail(
      booking.email,
      `❌ ${requestLabel} Request Declined — ${booking.serviceName}`,
      requestRejectedTemplate(booking, requestLabel, year),
    );
  }

  return updatedBooking;
};

const bookingAssignedToMemberIntoDB = async (
  id: string,
  payload: { assignedToMember: string },
) => {
  // 1️⃣ Booking exists check
  const isBookingExists = await Booking.findById(id);

  if (!isBookingExists) {
    throw new AppError(404, 'This booking is not found');
  }

  // 2️⃣ Booking status check — cannot assign if cancelled or completed
  if (['cancelled', 'completed'].includes(isBookingExists.status)) {
    throw new AppError(
      400,
      `Cannot assign a team member to a ${isBookingExists.status} booking`,
    );
  }

  const assignedMemberId = payload.assignedToMember;

  // 3️⃣ Validate team member (ownership + active + overlap-aware conflict)
  const teamMemberExists = await validateTeamMemberForBooking(
    isBookingExists.vendor,
    assignedMemberId,
    isBookingExists.date,
    isBookingExists.time,
    id,
  );

  // 4️⃣ Update booking
  const result = await Booking.findByIdAndUpdate(
    id,
    { assignedToMember: assignedMemberId },
    { new: true, runValidators: true },
  );

  // 5️⃣ Race condition guard
  if (!result) {
    throw new AppError(404, 'Booking update failed');
  }

  // 6️⃣ Notification to customer
  await NotificationServices.insertNotificationIntoDB({
    receiver: isBookingExists.user,
    message: '📋 Your specialist has been assigned!',
    description: `${teamMemberExists.firstName} ${teamMemberExists.lastName} has been assigned to your booking for "${isBookingExists.serviceName}" on ${isBookingExists.date} at ${isBookingExists.time}.`,
    reference: isBookingExists._id,
    model_type: ModeType.Booking,
  });

  await NotificationServices.insertNotificationIntoDB({
    receiver: teamMemberExists.user,
    message: '📅 A New Appointment Has Been Assigned to You',
    description: `You have been assigned to "${isBookingExists.serviceName}" on ${isBookingExists.date} at ${isBookingExists.time} by the vendor.`,
    reference: isBookingExists._id,
    model_type: ModeType.Booking,
  });

  // 7️⃣ Email to team member
  const memberName = `${teamMemberExists.firstName} ${teamMemberExists.lastName}`;
  const bookingDate = new Date(isBookingExists.date).toLocaleDateString(
    'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );
  const year = new Date().getFullYear();

  await sendEmail(
    teamMemberExists.email,
    `📋 New Booking Assigned — ${isBookingExists.serviceName}`,
    memberAssignedTemplate(
      memberName,
      {
        serviceName: isBookingExists.serviceName,
        date: isBookingExists.date,
        time: isBookingExists.time,
        status: isBookingExists.status,
        name: isBookingExists.name,
        email: isBookingExists.email,
        phone: isBookingExists.phone,
      },
      bookingDate,
      year,
    ),
  );

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

  // Send email only for completed or cancelled status
  const year = new Date().getFullYear();

  if (payload.status === 'completed') {
    await sendEmail(
      isBookingExists.email,
      `🎉 Service Completed — ${isBookingExists.serviceName}`,
      serviceCompletedTemplate(isBookingExists, year),
    );
  } else if (payload.status === 'cancelled') {
    await sendEmail(
      isBookingExists.email,
      `🚫 Booking Cancelled — ${isBookingExists.serviceName}`,
      bookingCancelledTemplate(isBookingExists, year),
    );
  }

  return result;
};

const getAvailableTeamMembersFromDB = async (
  vendorId: string,
  date: string,
  time: string,
) => {
  const allMembers = await TeamMember.find({
    vendor: vendorId,
    role: 'team_member',
    isActive: true,
    isDeleted: false,
  }).lean();

  if (!allMembers.length) return [];

  const allBookingsOnDate = await Booking.find({
    vendor: vendorId,
    date,
    status: { $ne: 'cancelled' },
    assignedToMember: { $ne: null },
  })
    .select('assignedToMember time')
    .lean();

  const busyIds = new Set(
    allBookingsOnDate
      .filter((b) => isTimeOverlapping(b.time, time))
      .map((b) => b.assignedToMember?.toString()),
  );

  return allMembers.map((m) => ({
    ...m,
    isBooked: busyIds.has(m._id.toString()),
  }));
};

export const BookingServices = {
  createBookingIntoDB,
  getBookingsByEmailFromDB,
  getBookingByIdFromDB,
  updateBookingRequestIntoDB,
  getAllBookingByVendorFromDB,
  getBookingAppointmentsFromDB,
  getBookingsByAssignedMember,
  bookingApprovedRequestIntoDB,
  bookingAssignedToMemberIntoDB,
  updateBookingStatusIntoDB,
  getAvailableTeamMembersFromDB,
};
