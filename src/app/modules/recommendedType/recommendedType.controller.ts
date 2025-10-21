import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RecommendedTypeServices } from './recommendedType.service';

const createRecommendedType = catchAsync(async (req, res) => {
  const result = await RecommendedTypeServices.createRecommendedTypeIntoDB(
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Recommended type add successfully',
    data: result,
  });
});

const getAllRecommendedType = catchAsync(async (req, res) => {
  const result = await RecommendedTypeServices.getAllRecommendedTypeFromDB(
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommended type retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getRecommendedTypeById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RecommendedTypeServices.getRecommendedTypeByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommended type retrieved successfully',
    data: result,
  });
});

const updateRecommendedType = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RecommendedTypeServices.updateRecommendedTypeIntoDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommended type has been updated successfully.',
    data: result,
  });
});

const deleteRecommendedType = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RecommendedTypeServices.deleteRecommendedTypeFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommended type deleted successfully',
    data: result,
  });
});

export const RecommendedTypeControllers = {
  createRecommendedType,
  getAllRecommendedType,
  getRecommendedTypeById,
  updateRecommendedType,
  deleteRecommendedType,
};
