import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { BookingValidation } from './booking.validation';
import { BookingControllers } from './booking.controller';

const router = express.Router();

router.post(
  '/',
  auth('user'),
  validateRequest(BookingValidation.createBookingValidationSchema),
  BookingControllers.createBooking,
);

router.get(
  '/appointments',
  auth('vendor', 'team_member'),
  BookingControllers.getBookingAppointments,
);

router.get(
  '/',
  auth('vendor', 'team_member'),
  BookingControllers.getAllBookingByVendor,
);

router.get('/user', auth('user'), BookingControllers.getBookingsByEmail);

router.get('/:id', BookingControllers.getBookingById);

router.patch(
  '/:id',
  auth('user'),
  validateRequest(BookingValidation.updateBookingValidationSchema),
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
  validateRequest(BookingValidation.assignedMemberValidationSchema),
  BookingControllers.bookingAssignedToMember,
);

router.put(
  '/update-status/:id',
  auth('vendor', 'team_member'),
  validateRequest(BookingValidation.updateBookingStatusValidationSchema),
  BookingControllers.updateBookingStatus,
);

export const BookingRoutes = router;
