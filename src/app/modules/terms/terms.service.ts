import AppError from '../../errors/AppError';
import { TTerms } from './terms.interface';
import { Terms } from './terms.model';

// Get terms (always single doc)
const getTermsFromDB = async () => {
  const result = await Terms.findOne({ isDeleted: false });
  if (!result) {
    throw new AppError(404, 'No terms are currently available.');
  }
  return result;
};

// Create/Update terms (upsert)
const upsertTermsIntoDB = async (payload: TTerms) => {
  const result = await Terms.findOneAndUpdate(
    {}, // empty filter → only one doc
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save terms');
  }
  return result;
};

// Soft delete (mark as deleted)
const deleteTermsFromDB = async () => {
  const isTermsExists = await Terms.findOne();
  if (!isTermsExists) {
    throw new AppError(404, 'Terms not found');
  }

  const result = await Terms.findOneAndUpdate(
    {},
    { isDeleted: true },
    { new: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to delete terms');
  }

  return result;
};

export const TermsServices = {
  getTermsFromDB,
  upsertTermsIntoDB,
  deleteTermsFromDB,
};
