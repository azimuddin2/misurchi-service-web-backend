import AppError from '../../errors/AppError';
import { Vendor } from '../vendor/vendor.model';
import { TCancellationPolicy } from './cancellationPolicy.interface';
import { CancellationPolicy } from './cancellationPolicy.model';

// Create or update cancellation policy (upsert)
const upsertCancellationPolicyIntoDB = async (payload: TCancellationPolicy) => {
  const vendorExists = await Vendor.findById({
    _id: payload.vendor,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const result = await CancellationPolicy.findOneAndUpdate(
    { vendor: vendorExists._id },
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save cancellation policy information');
  }
  return result;
};

// Get cancellation policy information for a specific vendor
const getCancellationPolicyFromDB = async (vendorId: string) => {
  const vendorExists = await Vendor.findById({
    _id: vendorId,
    isDeleted: false,
  });
  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const result = await CancellationPolicy.findOne({
    vendor: vendorExists._id,
    isDeleted: false,
  });
  return result;
};

export const CancellationPolicyService = {
  getCancellationPolicyFromDB,
  upsertCancellationPolicyIntoDB,
};
