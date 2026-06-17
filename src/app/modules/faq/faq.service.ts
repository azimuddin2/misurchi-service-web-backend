import AppError from '../../errors/AppError';
import { TFAQ } from './faq.interface';
import { FAQ } from './faq.model';

const createFAQIntoDB = async (payload: TFAQ) => {
  const result = await FAQ.create(payload);

  return result;
};

const getAllFAQFromDB = async () => {
  const result = await FAQ.find({
    isActive: true,
  }).sort({
    createdAt: -1,
  });

  return result;
};

const getAllFAQForAdminFromDB = async () => {
  const result = await FAQ.find().sort({
    createdAt: -1,
  });

  return result;
};

const getFAQByIdFromDB = async (id: string) => {
  const result = await FAQ.findById(id);

  if (!result) {
    throw new AppError(404, 'FAQ not found');
  }

  return result;
};

const updateFAQIntoDB = async (id: string, payload: Partial<TFAQ>) => {
  const isExists = await FAQ.findById(id);

  if (!isExists) {
    throw new AppError(404, 'FAQ not found');
  }

  const result = await FAQ.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const updateFAQStatusIntoDB = async (
  id: string,
  payload: { isActive: boolean },
) => {
  const isExists = await FAQ.findById(id);

  if (!isExists) {
    throw new AppError(404, 'FAQ not found');
  }

  const result = await FAQ.findByIdAndUpdate(id, payload, {
    new: true,
  });

  const message = payload.isActive
    ? 'FAQ has been activated successfully'
    : 'FAQ has been deactivated successfully';

  return { result, message };
};

export const FAQService = {
  createFAQIntoDB,
  getAllFAQFromDB,
  getAllFAQForAdminFromDB,
  getFAQByIdFromDB,
  updateFAQIntoDB,
  updateFAQStatusIntoDB,
};
