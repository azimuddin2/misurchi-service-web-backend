import mongoose, { ClientSession, startSession } from 'mongoose';
import { TReview } from './review.interface';
import { Product } from '../product/product.model';
import { Packages } from '../packages/packages.model';
import { Review } from './review.model';
import {
  getAverageProductRating,
  getAverageServiceRating,
} from './review.utils';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';

const createReviewIntoDB = async (payload: TReview) => {
  const session: ClientSession = await startSession();
  session.startTransaction();

  try {
    // Create the review
    const result: TReview[] = await Review.create([payload], { session });
    if (!result || result.length === 0) {
      throw new AppError(400, 'Failed to create review');
    }

    let targetId: string | undefined;
    let modelToUpdate: any;
    let averageData: { averageRating: number; totalReviews: number };

    if (result[0].product) {
      targetId = result[0].product.toString();
      modelToUpdate = Product;
      averageData = await getAverageProductRating(targetId); // ✅ product rating
    } else if (result[0].service) {
      targetId = result[0].service.toString();
      modelToUpdate = Packages;
      averageData = await getAverageServiceRating(targetId); // ✅ service rating
    } else {
      throw new AppError(400, 'Review must belong to a product or service');
    }

    const { averageRating, totalReviews } = averageData;

    const newAvgRating =
      (Number(averageRating) * Number(totalReviews) + Number(payload.rating)) /
      (totalReviews + 1);

    await modelToUpdate.findByIdAndUpdate(
      targetId,
      {
        avgRating: newAvgRating,
        $addToSet: { reviews: result[0]._id },
      },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return result[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(400, error?.message || 'Review creation failed');
  }
};

const getAllReviewsFromDB = async (query: Record<string, any>) => {
  const reviewsModel = new QueryBuilder(
    Review.find().populate([
      { path: 'product', select: 'name images productType' },
      { path: 'service', select: 'name type images vendor' },
      { path: 'user', select: 'fullName email image' },
      { path: 'vendor', select: 'businessName email image' },
    ]),
    query,
  )
    .search(['review'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await reviewsModel.modelQuery;
  const meta = await reviewsModel.countTotal();

  return {
    data,
    meta,
  };
};

const getAllReviewByUserFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid Vendor ID');
  }

  // Base query -> always exclude deleted reviews
  let reviewQuery = Review.find({ vendor, isDeleted: false });

  const queryBuilder = new QueryBuilder(reviewQuery, filters)
    .search([''])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

export const ReviewService = {
  createReviewIntoDB,
  getAllReviewsFromDB,
  getAllReviewByUserFromDB,
};
