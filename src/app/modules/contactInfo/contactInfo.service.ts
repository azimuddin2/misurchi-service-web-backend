import AppError from '../../errors/AppError';
import { ContactInfo } from './contactInfo.model';
import { TContactInfo } from './contactInfo.interface';

const getContactInfoFromDB = async () => {
  const result = await ContactInfo.findOne();
  return result;
};

const updateContactInfoIntoDB = async (payload: Partial<TContactInfo>) => {
  const isContactInfoExists = await ContactInfo.findOne();

  // First-time setup: no record exists yet, so create one.
  if (!isContactInfoExists) {
    const result = await ContactInfo.create(payload);
    if (!result) {
      throw new AppError(400, 'Failed to create contact info');
    }
    return result;
  }

  // Otherwise update the single existing record.
  const updatedContactInfo = await ContactInfo.findByIdAndUpdate(
    isContactInfoExists._id,
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedContactInfo) {
    throw new AppError(400, 'Contact info update failed');
  }

  return updatedContactInfo;
};

export const ContactInfoServices = {
  getContactInfoFromDB,
  updateContactInfoIntoDB,
};
