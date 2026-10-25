import AppError from '../../errors/AppError';
import { TPrivacy } from './privacy.interface';
import { Privacy } from './privacy.model';

// Get privacy (always single doc)
const getPrivacyFromDB = async () => {
  const result = await Privacy.findOne({ isDeleted: false });
  if (!result) {
    throw new AppError(404, 'No active privacy policy is currently available.');
  }
  return result;
};

// Create/Update privacy (upsert)
const upsertPrivacyIntoDB = async (payload: TPrivacy) => {
  const result = await Privacy.findOneAndUpdate(
    {}, // empty filter → only one doc
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save privacy');
  }
  return result;
};

// Soft delete (mark as deleted)
const deletePrivacyFromDB = async () => {
  const isPrivacyExists = await Privacy.findOne();
  if (!isPrivacyExists) {
    throw new AppError(404, 'Privacy not found');
  }

  const result = await Privacy.findOneAndUpdate(
    {},
    { isDeleted: true },
    { new: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to delete privacy');
  }

  return result;
};

export const PrivacyServices = {
  getPrivacyFromDB,
  upsertPrivacyIntoDB,
  deletePrivacyFromDB,
};
