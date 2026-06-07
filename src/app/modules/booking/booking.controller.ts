import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookingServices } from './booking.service';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.createBookingIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service booking successfully',
    data: result,
  });
});

const getAllBookingByVendor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BookingServices.getAllBookingByVendorFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Bookings retrieved successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

const getBookingAppointments = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BookingServices.getBookingAppointmentsFromDB(
      req.query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Bookings retrieved successfully',
      data: result,
    });
  },
);

const getBookingsByEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.query;
  const result = await BookingServices.getBookingsByEmailFromDB(
    email as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Bookings fetched successfully',
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingServices.getBookingByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking retrieved successfully',
    data: result,
  });
});

const updateBookingRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingServices.updateBookingRequestIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service booking successfully',
    data: result,
  });
});

const bookingApprovedRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const vendorApproved = Boolean(req.body.vendorApproved);

    const updatedBooking = await BookingServices.bookingApprovedRequestIntoDB(
      id,
      vendorApproved,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Request ${vendorApproved ? 'approved' : 'rejected'} successfully.`,
      data: updatedBooking,
    });
  },
);

const bookingAssignedToMember = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BookingServices.bookingAssignedToMemberIntoDB(
      id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Member assigned successfully',
      data: result,
    });
  },
);

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingServices.updateBookingStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  getAllBookingByVendor,
  getBookingAppointments,
  getBookingsByEmail,
  getBookingById,
  updateBookingRequest,
  bookingApprovedRequest,
  bookingAssignedToMember,
  updateBookingStatus,
};
