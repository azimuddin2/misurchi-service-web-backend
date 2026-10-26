import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookingValidations } from './booking.validation';
import { BookingControllers } from './booking.controller';

const router = express.Router();

router.post(
  '/',
  auth('user'),
  validateRequest(BookingValidations.createBookingValidationSchema),
  BookingControllers.createBooking,
);

router.get(
  '/appointments',
  auth('vendor', 'team_member'),
  BookingControllers.getBookingAppointments,
);

router.get(
  '/member-appointments',
  auth('vendor', 'team_member'),
  BookingControllers.getBookingsByAssignedMember,
);

router.get('/available-members', BookingControllers.getAvailableTeamMembers);

router.get(
  '/',
  auth('vendor', 'team_member'),
  BookingControllers.getAllBookingByVendor,
);

router.get('/user', auth('user'), BookingControllers.getBookingsByEmail);

router.get('/:id', BookingControllers.getBookingById);

router.patch(
  '/:id',
  auth('user', 'vendor', 'team_member'),
  validateRequest(BookingValidations.updateBookingValidationSchema),
  BookingControllers.updateBookingRequest,
);

router.put(
  '/update-request/:id',
  auth('vendor', 'team_member'),
  BookingControllers.bookingApprovedRequest,
);

router.patch(
  '/assign/:id',
  auth('vendor', 'team_member'),
  validateRequest(BookingValidations.assignedMemberValidationSchema),
  BookingControllers.bookingAssignedToMember,
);

router.put(
  '/update-status/:id',
  auth('vendor', 'team_member'),
  validateRequest(BookingValidations.updateBookingStatusValidationSchema),
  BookingControllers.updateBookingStatus,
);

export const BookingRoutes = router;
