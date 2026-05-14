import AppError from '../../errors/AppError';
import { Vendor } from '../vendor/vendor.model';
import { TReturnPolicy } from './returnPolicy.interfact';
import { ReturnPolicy } from './returnPolicy.model';

// Create or update return policy (upsert)
const upsertReturnPolicyIntoDB = async (payload: TReturnPolicy) => {
  const vendorExists = await Vendor.findById({
    _id: payload.vendor,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const result = await ReturnPolicy.findOneAndUpdate(
    { vendor: vendorExists._id },
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save return policy information');
  }
  return result;
};

// Get return policy information for a specific vendor
const getReturnPolicyFromDB = async (vendorId: string) => {
  const vendorExists = await Vendor.findById({
    _id: vendorId,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const result = await ReturnPolicy.findOne({
    vendor: vendorExists._id,
    isDeleted: false,
  });

  return result;
};

export const ReturnPolicyService = {
  getReturnPolicyFromDB,
  upsertReturnPolicyIntoDB,
};
