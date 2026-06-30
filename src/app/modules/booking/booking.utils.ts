import { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { TeamMember } from '../teamMember/teamMember.model';
import { Booking } from './booking.model';

export const generateBookingId = (): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `#BKG-${randomNumber}`;
};

export const parseTimeToMinutes = (str: string) => {
  const [time, modifier] = str.trim().split(' ');
  const [h, m] = time.split(':').map(Number);
  let hours = h + (modifier === 'PM' && h !== 12 ? 12 : 0);
  if (modifier === 'AM' && h === 12) hours = 0;
  return hours * 60 + (m || 0);
};

export const isTimeOverlapping = (timeA: string, timeB: string) => {
  const [aStartStr, aEndStr] = timeA.split(' - ');
  const [bStartStr, bEndStr] = timeB.split(' - ');

  const aStart = parseTimeToMinutes(aStartStr);
  const aEnd = parseTimeToMinutes(aEndStr);
  const bStart = parseTimeToMinutes(bStartStr);
  const bEnd = parseTimeToMinutes(bEndStr);

  return aStart < bEnd && aEnd > bStart;
};

export const validateTeamMemberForBooking = async (
  vendorId: Types.ObjectId | string,
  memberId: string,
  date: string,
  time: string,
  excludeBookingId?: string,
) => {
  if (!Types.ObjectId.isValid(memberId)) {
    throw new AppError(400, 'Invalid Team Member ID');
  }

  const teamMember = await TeamMember.findById(memberId).lean();
  if (!teamMember) {
    throw new AppError(404, 'Team member not found');
  }

  if (teamMember.isDeleted) {
    throw new AppError(400, 'This team member has been removed');
  }

  if (!teamMember.isActive) {
    throw new AppError(400, 'This team member is currently inactive');
  }

  // vendor field could be ObjectId or populated TVendor — handle both
  const memberVendorId =
    typeof teamMember.vendor === 'object' && '_id' in teamMember.vendor
      ? (teamMember.vendor as any)._id.toString()
      : teamMember.vendor.toString();

  if (memberVendorId !== vendorId.toString()) {
    throw new AppError(400, 'This team member does not belong to this vendor');
  }

  const conflictQuery: Record<string, unknown> = {
    assignedToMember: memberId,
    date,
    time,
    status: { $ne: 'cancelled' },
  };
  if (excludeBookingId) conflictQuery._id = { $ne: excludeBookingId };

  const conflict = await Booking.findOne(conflictQuery).lean();
  if (conflict) {
    throw new AppError(
      409,
      'This team member is already booked for this time slot',
    );
  }

  return teamMember;
};

export const getAvailableTeamMembersForSlot = async (
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

  const busyBookings = await Booking.find({
    vendor: vendorId,
    date,
    time,
    status: { $ne: 'cancelled' },
    assignedToMember: { $ne: null },
  })
    .select('assignedToMember')
    .lean();

  const busyIds = new Set(
    busyBookings.map((b) => b.assignedToMember?.toString()),
  );

  return allMembers.filter((m) => !busyIds.has(m._id.toString()));
};
