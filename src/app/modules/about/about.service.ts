import AppError from '../../errors/AppError';
import { TAbout } from './about.interface';
import { About } from './about.model';

// Get About info (singleton)
const getAboutFromDB = async () => {
  const result = await About.findOne({ isDeleted: false });
  if (!result) {
    throw new AppError(404, 'No about information is currently available.');
  }
  return result;
};

// Create or update About (upsert)
const upsertAboutIntoDB = async (payload: TAbout) => {
  const result = await About.findOneAndUpdate(
    {}, // empty filter → only one doc
    { ...payload, isDeleted: false },
    { new: true, upsert: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to save about information');
  }
  return result;
};

// Soft delete About (mark as deleted)
const deleteAboutFromDB = async () => {
  const isAboutExists = await About.findOne();
  if (!isAboutExists) {
    throw new AppError(404, 'About information not found');
  }

  const result = await About.findOneAndUpdate(
    {},
    { isDeleted: true },
    { new: true },
  );

  if (!result) {
    throw new AppError(400, 'Failed to delete about information');
  }

  return result;
};

export const AboutServices = {
  getAboutFromDB,
  upsertAboutIntoDB,
  deleteAboutFromDB,
};
