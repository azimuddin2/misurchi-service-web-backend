import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { UploadedFiles } from '../../interface/common.interface';
import {
  deleteManyFromS3,
  uploadManyToS3,
} from '../../utils/awsS3FileUploader';
import { productSearchableFields } from './product.constant';
import { TProduct } from './product.interface';
import { Product } from './product.model';
import { generateProductCode } from './product.utils';
import { Vendor } from '../vendor/vendor.model';
import { User } from '../user/user.model';

const createProductIntoDB = async (payload: TProduct, files: any) => {
  // Check vendor existence
  const vendorExists = await Vendor.findById({
    _id: payload.vendor,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  // Check user existence
  const userExists = await User.findById({
    _id: payload.user,
    isDeleted: false,
  });
  if (!userExists) {
    throw new Error('User not found');
  }

  // Assign backend-specific product code
  payload.productCode = generateProductCode();

  // Handle image upload to S3
  if (files) {
    const { images } = files as UploadedFiles;

    if (!images?.length) {
      throw new AppError(404, 'At least one image is required');
    }

    if (images?.length) {
      const imgsArray = images.map((image) => ({
        file: image,
        path: `images/product`,
      }));

      try {
        payload.images = await uploadManyToS3(imgsArray); // Await all uploads before proceeding
      } catch (error) {
        throw new AppError(500, 'Image upload failed');
      }
    }
  }

  const result = await Product.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create products');
  }
  return result;
};

const getAllProductFromDB = async (query: Record<string, unknown>) => {
  const {
    minPrice,
    maxPrice,
    minDiscount,
    maxDiscount,
    productType,
    page = 1,
    limit = 10,
    ...restQuery
  } = query;

  const mongoFilter: Record<string, any> = { isDeleted: false };

  // ✅ Product Type filter
  if (productType) {
    const types = String(productType)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (types.length > 0) {
      mongoFilter.productType = { $in: types.map((t) => new RegExp(t, 'i')) };
    }
  }

  // ✅ Expression conditions for price & discount
  const exprConditions: any[] = [];

  // Safe price expression
  const priceExpr = {
    $cond: [
      { $eq: [{ $type: '$price' }, 'string'] },
      { $toDouble: '$price' },
      { $ifNull: ['$price', 0] },
    ],
  };

  if (minPrice && String(minPrice).trim() !== '') {
    exprConditions.push({ $gte: [priceExpr, Number(minPrice)] });
  }
  if (maxPrice && String(maxPrice).trim() !== '') {
    exprConditions.push({ $lte: [priceExpr, Number(maxPrice)] });
  }

  // Safe discount expression (handles "30%" or numeric 30)
  const discountExpr = {
    $cond: [
      { $regexMatch: { input: '$discountPrice', regex: /%/ } },
      {
        $toDouble: {
          $replaceAll: {
            input: { $ifNull: ['$discountPrice', '0%'] },
            find: '%',
            replacement: '',
          },
        },
      },
      { $toDouble: { $ifNull: ['$discountPrice', 0] } },
    ],
  };

  if (minDiscount && String(minDiscount).trim() !== '') {
    exprConditions.push({ $gte: [discountExpr, Number(minDiscount)] });
  }
  if (maxDiscount && String(maxDiscount).trim() !== '') {
    exprConditions.push({ $lte: [discountExpr, Number(maxDiscount)] });
  }

  // ✅ Run aggregate if price or discount filters exist
  let matchedProductIds: string[] | null = null;

  if (exprConditions.length > 0) {
    const matchStage = {
      isDeleted: false,
      $expr:
        exprConditions.length === 1
          ? exprConditions[0]
          : { $and: exprConditions },
    };

    const matchedDocs = await Product.aggregate([
      { $match: matchStage },
      { $project: { _id: 1 } },
    ]);

    matchedProductIds = matchedDocs
      .map((d) => d._id?.toString())
      .filter(Boolean);

    // If no matches found, return empty response early
    if (matchedProductIds.length === 0) {
      return {
        meta: {
          page: Number(page),
          limit: Number(limit),
          totalDoc: 0,
          totalPage: 0,
        },
        result: [],
      };
    }
  }

  // ✅ Final filter (includes others + matched IDs)
  const finalFindFilter: any = {
    ...mongoFilter,
    ...(matchedProductIds ? { _id: { $in: matchedProductIds } } : {}),
  };

  const productQuery = Product.find(finalFindFilter)
    .populate('vendor')
    .populate('user');

  const queryBuilder = new QueryBuilder(productQuery, restQuery)
    .search(productSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getAllProductByUserFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted products
  let productQuery = Product.find({ vendor, isDeleted: false })
    .populate('vendor')
    .populate('user');

  const queryBuilder = new QueryBuilder(productQuery, filters)
    .search(productSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getProductByIdFromDB = async (id: string) => {
  const result = await Product.findById(id)
    .populate('vendor')
    .populate('user')
    .populate({
      path: 'reviews',
      select: '_id rating review user', // include the fields you need
    });

  if (!result) {
    throw new AppError(404, 'This product not found');
  }

  return result;
};

const updateProductIntoDB = async (
  id: string,
  payload: Partial<TProduct>,
  files: any,
) => {
  const isProductExists = await Product.findById(id);

  if (!isProductExists) {
    throw new AppError(404, 'This product not found');
  }

  const { deleteKey, ...updateData } = payload; // color isn't used, so removed it

  // Handle image upload to S3
  if (files) {
    const { images } = files as UploadedFiles;

    if (images?.length) {
      const imgsArray = images.map((image) => ({
        file: image,
        path: `images/product`,
      }));

      try {
        payload.images = await uploadManyToS3(imgsArray); // Await all uploads before proceeding
      } catch (error) {
        throw new AppError(500, 'Image upload failed');
      }
    }
  }

  // Handle image deletions (if any)
  if (deleteKey && deleteKey.length > 0) {
    const newKey = deleteKey?.map((key: any) => `images/product/${key}`);

    if (newKey.length > 0) {
      await deleteManyFromS3(newKey); // Delete images from S3
      // Remove deleted images from the product
      await Product.findByIdAndUpdate(
        id,
        {
          $pull: { images: { key: { $in: deleteKey } } },
        },
        { new: true },
      );
    }
  }

  // If new images are provided, push them to the product
  if (payload?.images && payload.images.length > 0) {
    try {
      await Product.findByIdAndUpdate(
        id,
        { $addToSet: { images: { $each: payload.images } } }, // Push new images to the product
        { new: true },
      );
      delete payload.images; // Remove images from the payload after pushing
    } catch (error) {
      throw new AppError(400, 'Failed to update images');
    }
  }

  // Update other product details
  try {
    const result = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!result) {
      throw new AppError(400, 'Product update failed');
    }

    return result;
  } catch (error: any) {
    console.log(error);
    throw new AppError(500, 'Product update failed');
  }
};

const updateProductStatusIntoDB = async (
  id: string,
  payload: { status: string },
) => {
  const isProductExists = await Product.findById(id);

  if (!isProductExists) {
    throw new AppError(404, 'This product is not found');
  }

  const result = await Product.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const updateProductHighlightStatusIntoDB = async (
  id: string,
  payload: { highlightStatus: string },
) => {
  const isProductExists = await Product.findById(id);

  if (!isProductExists) {
    throw new AppError(404, 'This product is not found');
  }

  const result = await Product.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const deleteProductFromDB = async (id: string) => {
  const isProductExists = await Product.findById(id);

  if (!isProductExists) {
    throw new AppError(404, 'This product is not found');
  }

  const result = await Product.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete product');
  }

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductFromDB,
  getAllProductByUserFromDB,
  getProductByIdFromDB,
  updateProductIntoDB,
  updateProductStatusIntoDB,
  updateProductHighlightStatusIntoDB,
  deleteProductFromDB,
};
