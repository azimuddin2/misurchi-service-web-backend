import AppError from '../../errors/AppError';
import { ReferralSettings } from './referralSettings.model';
import { TReferralSettings } from './referralSettings.interface';

const getReferralSettingsFromDB = async () => {
  const result = await ReferralSettings.findOne();

  if (!result) {
    throw new AppError(404, 'Referral settings not found');
  }

  return result;
};

const updateReferralSettingsIntoDB = async (
  payload: Partial<TReferralSettings>,
) => {
  const isReferralSettingsExists = await ReferralSettings.findOne();

  // First-time setup: no record exists yet, so create one.
  if (!isReferralSettingsExists) {
    const result = await ReferralSettings.create(payload);

    if (!result) {
      throw new AppError(400, 'Failed to create referral settings');
    }

    return result;
  }

  // Otherwise update the single existing record.
  const updatedReferralSettings = await ReferralSettings.findByIdAndUpdate(
    isReferralSettingsExists._id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedReferralSettings) {
    throw new AppError(400, 'Referral settings update failed');
  }

  return updatedReferralSettings;
};

export const ReferralSettingsServices = {
  getReferralSettingsFromDB,
  updateReferralSettingsIntoDB,
};
