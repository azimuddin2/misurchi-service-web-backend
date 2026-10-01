import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductTypeServices } from './productType.service';

const createProductType = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductTypeServices.createProductTypeIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product type add successfully',
    data: result,
  });
});

const getAllProductType = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductTypeServices.getAllProductTypeFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product type retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getProductTypeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductTypeServices.getProductTypeByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product type retrieved successfully',
    data: result,
  });
});

const updateProductType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductTypeServices.updateProductTypeIntoDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product type has been updated successfully.',
    data: result,
  });
});

const deleteProductType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductTypeServices.deleteProductTypeFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product type deleted successfully',
    data: result,
  });
});

export const ProductTypeControllers = {
  createProductType,
  getAllProductType,
  getProductTypeById,
  updateProductType,
  deleteProductType,
};
