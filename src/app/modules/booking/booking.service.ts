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
import { TeamMember } from '../teamMember/teamMember.model';
import { sendEmail } from '../../utils/sendEmail';

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
      select: 'firstName lastName email phone role',
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
      message: '🎉 Your Request Has Been Approved!',
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
  payload: { assignedToMember: string },
) => {
  const isBookingExists = await Booking.findById(id);

  if (!isBookingExists) {
    throw new AppError(404, 'This booking is not found');
  }

  const assignedMemberId = payload.assignedToMember;

  if (!Types.ObjectId.isValid(assignedMemberId)) {
    throw new AppError(400, 'Invalid Team Member ID');
  }

  const teamMemberExists = await TeamMember.findById(assignedMemberId);

  if (!teamMemberExists) {
    throw new AppError(404, 'Team Member not found');
  }

  // Update booking
  const result = await Booking.findByIdAndUpdate(
    id,
    { assignedToMember: assignedMemberId },
    { new: true, runValidators: true },
  );

  // ── Email ──────────────────────────────────────────────────────────────────
  const memberName = `${teamMemberExists.firstName} ${teamMemberExists.lastName}`;
  const bookingDate = new Date(isBookingExists.date).toLocaleDateString(
    'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  );
  const year = new Date().getFullYear();

  await sendEmail(
    teamMemberExists.email,
    `📋 New Booking Assigned — ${isBookingExists.serviceName}`,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Booking Assigned</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0AA84C 0%,#087a38 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1.5px;text-transform:uppercase;">
                Scott Clements
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">
                New Booking Assigned
              </h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                You have a new appointment to manage
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0;font-size:16px;color:#1a1a1a;line-height:1.6;">
                Hi <strong>${memberName}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:15px;color:#555555;line-height:1.7;">
                A new booking has been assigned to you. Please review the details
                below and make sure everything is prepared before the appointment.
              </p>
            </td>
          </tr>

          <!-- Booking Details Card -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fdf9;border:1px solid #d4edda;border-radius:12px;overflow:hidden;">

                <tr>
                  <td colspan="2"
                    style="background:#e8f7ee;padding:14px 20px;border-bottom:1px solid #d4edda;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0AA84C;
                       letter-spacing:1px;text-transform:uppercase;">
                      📅 Booking Details
                    </p>
                  </td>
                </tr>

                <!-- Service -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;width:40%;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Service
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">
                      ${isBookingExists.serviceName}
                    </p>
                  </td>
                </tr>

                <!-- Date -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Date
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">
                      ${bookingDate}
                    </p>
                  </td>
                </tr>

                <!-- Time -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Time
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">
                      ${isBookingExists.time}
                    </p>
                  </td>
                </tr>

                <!-- Status -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Status
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <span style="display:inline-block;padding:3px 12px;background:#fff3cd;
                      color:#856404;border-radius:20px;font-size:12px;font-weight:600;
                      text-transform:capitalize;border:1px solid #ffc107;">
                      ${isBookingExists.status}
                    </span>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td colspan="2"
                    style="background:#e8f7ee;padding:14px 20px;border-top:1px solid #d4edda;border-bottom:1px solid #d4edda;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#0AA84C;
                       letter-spacing:1px;text-transform:uppercase;">
                      👤 Customer Information
                    </p>
                  </td>
                </tr>

                <!-- Customer Name -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Name
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">
                      ${isBookingExists.name}
                    </p>
                  </td>
                </tr>

                <!-- Customer Email -->
                <tr style="border-bottom:1px solid #e8f0eb;">
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Email
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <a href="mailto:${isBookingExists.email}"
                      style="font-size:14px;color:#0AA84C;text-decoration:none;font-weight:500;">
                      ${isBookingExists.email}
                    </a>
                  </td>
                </tr>

                <!-- Customer Phone -->
                <tr>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <p style="margin:0;font-size:13px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Phone
                    </p>
                  </td>
                  <td style="padding:14px 20px;vertical-align:top;">
                    <a href="tel:${isBookingExists.phone}"
                      style="font-size:14px;color:#0AA84C;text-decoration:none;font-weight:500;">
                      ${isBookingExists.phone}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA Note -->
          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;">
                      ⚠️ <strong>Action Required:</strong> Please log in to your dashboard
                      to confirm your availability and review the full booking details
                      before the appointment date.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td style="padding:28px 40px 36px;">
              <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
                If you have any questions or concerns about this booking, please
                contact your manager or reply to this email.
              </p>
              <p style="margin:20px 0 0;font-size:15px;color:#1a1a1a;">
                Best regards,<br/>
                <strong style="color:#0AA84C;">Scott Clements Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:20px 40px;text-align:center;
              border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;line-height:1.6;">
                © ${year} Scott Clements. All rights reserved.<br/>
                This email was sent because a booking was assigned to you.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
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

  return result;
};

export const BookingServices = {
  createBookingIntoDB,
  getBookingsByEmailFromDB,
  getBookingByIdFromDB,
  updateBookingRequestIntoDB,
  getAllBookingByVendorFromDB,
  getBookingAppointmentsFromDB,
  bookingApprovedRequestIntoDB,
  bookingAssignedToMemberIntoDB,
  updateBookingStatusIntoDB,
};
