import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ContactInfoServices } from './contactInfo.service';

const getContactInfo = catchAsync(async (req, res) => {
  const result = await ContactInfoServices.getContactInfoFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact info retrieved successfully',
    data: result,
  });
});

const updateContactInfo = catchAsync(async (req, res) => {
  const result = await ContactInfoServices.updateContactInfoIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact info updated successfully',
    data: result,
  });
});

export const ContactInfoControllers = {
  getContactInfo,
  updateContactInfo,
};
