import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { recommendedTypeSearchableFields } from './recommendedType.constant';
import { TRecommendedType } from './recommendedType.interface';
import { RecommendedType } from './recommendedType.model';

const createRecommendedTypeIntoDB = async (payload: TRecommendedType) => {
  const filter = { name: payload.name };

  const isRecommendedTypeExists = await RecommendedType.findOne(filter);

  if (isRecommendedTypeExists) {
    throw new AppError(404, 'This service type already exists');
  }

  const result = await RecommendedType.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create recommended type');
  }
  return result;
};

const getAllRecommendedTypeFromDB = async (query: Record<string, unknown>) => {
  const recommendedTypeQuery = new QueryBuilder(
    RecommendedType.find({ isDeleted: false }),
    query,
  )
    .search(recommendedTypeSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await recommendedTypeQuery.countTotal();
  const result = await recommendedTypeQuery.modelQuery;

  return { meta, result };
};

const getRecommendedTypeByIdFromDB = async (id: string) => {
  const result = await RecommendedType.findById(id);

  if (!result) {
    throw new AppError(404, 'This recommended type not found');
  }

  if (result.isDeleted === true) {
    throw new AppError(400, 'This recommended type has been deleted');
  }

  return result;
};

const updateRecommendedTypeIntoDB = async (
  id: string,
  payload: Partial<TRecommendedType>,
) => {
  const isRecommendedTypeExists = await RecommendedType.findById(id);

  if (!isRecommendedTypeExists) {
    throw new AppError(404, 'This recommended type not exists');
  }

  if (isRecommendedTypeExists.isDeleted === true) {
    throw new AppError(400, 'This recommended type has been deleted');
  }

  const updatedRecommendedType = await RecommendedType.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedRecommendedType) {
    throw new AppError(400, 'recommended type update failed');
  }

  return updatedRecommendedType;
};

const deleteRecommendedTypeFromDB = async (id: string) => {
  const isRecommendedTypeExists = await RecommendedType.findById(id);

  if (!isRecommendedTypeExists) {
    throw new AppError(404, 'Recommended type not found');
  }

  const result = await RecommendedType.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete recommended type');
  }

  return result;
};

export const RecommendedTypeServices = {
  createRecommendedTypeIntoDB,
  getAllRecommendedTypeFromDB,
  getRecommendedTypeByIdFromDB,
  updateRecommendedTypeIntoDB,
  deleteRecommendedTypeFromDB,
};
