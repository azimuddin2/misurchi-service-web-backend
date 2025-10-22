import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { VendorServices } from './vendor.service';

const getAllVendors = catchAsync(async (req, res) => {
  const result = await VendorServices.getAllVendorsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getVendorProfile = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await VendorServices.getVendorProfileFromDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const getVendorUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VendorServices.getVendorUserByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateVendorProfile = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await VendorServices.updateVendorProfileIntoDB(
    email,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile has been updated successfully.',
    data: result,
  });
});

const chooseOffer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VendorServices.chooseOfferIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `Thanks! Your offer choice has been recorded successfully.`,
    data: result,
  });
});

const getVendorSummary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VendorServices.getVendorSummaryFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor summary data fetched successfully',
    data: result,
  });
});

export const VendorControllers = {
  getAllVendors,
  getVendorProfile,
  getVendorUserById,
  updateVendorProfile,
  chooseOffer,
  getVendorSummary,
};
