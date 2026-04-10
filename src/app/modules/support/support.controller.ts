import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SupportServices } from './support.service';

const createSupport = catchAsync(async (req, res) => {
  const result = await SupportServices.createSupportIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Support message submitted successfully.',
    data: result,
  });
});

const getAllSupport = catchAsync(async (req, res) => {
  const result = await SupportServices.getAllSupportFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support message retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getSupportByEmail = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await SupportServices.getSupportByEmailFromDB(
    email,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support messages retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getSupportById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SupportServices.getSupportByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support message retrieved successfully',
    data: result,
  });
});

const updateSupport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SupportServices.updateSupportIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support message reply successfully.',
    data: result,
  });
});

const supportMarkHelpful = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isHelpful } = req.body;
  const result = await SupportServices.supportMarkHelpfulIntoDB(id, isHelpful);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support message marked as helpful successfully.',
    data: result,
  });
});

const deleteSupport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SupportServices.deleteSupportFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support deleted successfully',
    data: result,
  });
});

export const SupportControllers = {
  createSupport,
  getAllSupport,
  getSupportByEmail,
  getSupportById,
  updateSupport,
  supportMarkHelpful,
  deleteSupport,
};
