import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProductServices } from './product.service';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createProductIntoDB(req.body, req.files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Products created successfully',
    data: result,
  });
});

const getAllProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getAllProductFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getAllProductByVendor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProductServices.getAllProductByVendorFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Products retrieved successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.getProductByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.updateProductIntoDB(
    id,
    req.body,
    req.files,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.updateProductStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

const updateProductHighlightStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ProductServices.updateProductHighlightStatusIntoDB(
      id,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Highlight status updated successfully.',
      data: result,
    });
  },
);

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductServices.deleteProductFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProduct,
  getAllProductByVendor,
  getProductById,
  updateProduct,
  updateProductStatus,
  updateProductHighlightStatus,
  deleteProduct,
};
