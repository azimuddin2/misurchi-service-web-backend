import { Types } from 'mongoose';
import { Review } from './review.model';

interface IReturn {
  averageRating: number;
  totalReviews: number;
}

export const getAverageProductRating = async (
  productId: string,
): Promise<IReturn> => {
  const result = await Review.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length ? result[0] : { averageRating: 0, totalReviews: 0 };
};

export const getAverageServiceRating = async (
  serviceId: string,
): Promise<IReturn> => {
  const result = await Review.aggregate([
    { $match: { service: new Types.ObjectId(serviceId) } },
    {
      $group: {
        _id: '$service',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length ? result[0] : { averageRating: 0, totalReviews: 0 };
};

export const getAverageVendorRating = async (
  vendorId: string,
): Promise<IReturn> => {
  const result = await Review.aggregate([
    { $match: { vendor: new Types.ObjectId(vendorId) } },
    {
      $group: {
        _id: '$vendor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length ? result[0] : { averageRating: 0, totalReviews: 0 };
};
