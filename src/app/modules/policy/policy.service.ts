import AppError from '../../errors/AppError';
import { TPolicy } from './policy.interface';
import { Policy } from './policy.model';

// Get policy (always single doc)
const getPolicyFromDB = async () => {
  const result = await Policy.findOne({ isDeleted: false });
  if (!result) {
    throw new AppError(404, 'No active policy is currently available.');
  }
  return result;
};

// Create/Update policy (upsert)
const upsertPolicyIntoDB = async (payload: TPolicy) => {
  const result = await Policy.findOneAndUpdate(
    {}, // empty filter → only one doc
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save policy');
  }

  return result;
};

// Soft delete (mark as deleted)
const deletePolicyFromDB = async () => {
  const isPolicyExists = await Policy.findOne();
  if (!isPolicyExists) {
    throw new AppError(404, 'Policy not found');
  }

  const result = await Policy.findOneAndUpdate(
    {},
    { isDeleted: true },
    { new: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to delete policy');
  }

  return result;
};

export const PolicyServices = {
  getPolicyFromDB,
  upsertPolicyIntoDB,
  deletePolicyFromDB,
};
