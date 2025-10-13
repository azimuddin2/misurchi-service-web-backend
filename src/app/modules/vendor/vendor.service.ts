import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { deleteFromS3, uploadToS3 } from '../../utils/awsS3FileUploader';
import { User } from '../user/user.model';
import { TVendor } from './vendor.interface';
import { Vendor } from './vendor.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { vendorSearchableFields } from './vendor.constant';

const getAllVendorsFromDB = async (query: Record<string, unknown>) => {
  const vendorQuery = new QueryBuilder(Vendor.find(), query)
    .search(vendorSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await vendorQuery.countTotal();
  const result = await vendorQuery.modelQuery;

  return { meta, result };
};

const getVendorProfileFromDB = async (email: string) => {
  const result = await Vendor.findOne({ email: email }).populate('userId');
  return result;
};

const getVendorUserByIdFromDB = async (id: string) => {
  const result = await Vendor.findById(id).populate('userId');
  return result;
};

const updateVendorProfileIntoDB = async (
  email: string,
  payload: Partial<TVendor>,
  file?: Express.Multer.File,
) => {
  // 🔍 Step 1: Check if vendor exists & get userId
  const existingVendor = await Vendor.findOne({ email }).select('userId image');
  if (!existingVendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 📸 Step 2: Handle image upload
    if (file) {
      const uploadedUrl = await uploadToS3({
        file,
        fileName: `images/vendor/profile/${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`,
      });

      // 🧹 Delete old image if exists
      if (existingVendor.image) {
        await deleteFromS3(existingVendor.image);
      }

      payload.image = uploadedUrl;
    }

    // 📝 Step 3: Update linked User
    const updatedUser = await User.findByIdAndUpdate(
      existingVendor.userId, // ✅ correct user reference
      { $set: { ...payload, role: 'vendor' } },
      { new: true, runValidators: true, session },
    );
    if (!updatedUser) {
      throw new AppError(400, 'Failed to update user');
    }

    // 📝 Step 4: Update Vendor
    const updatedVendor = await Vendor.findOneAndUpdate(
      { email },
      { $set: payload },
      { new: true, runValidators: true, session },
    );
    if (!updatedVendor) {
      throw new AppError(400, 'Failed to update vendor');
    }

    // ✅ Step 5: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedVendor;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'Vendor profile update failed');
  }
};

const chooseOfferIntoDB = async (id: string, payload: { chooseOffer: string }) => {
  const result = await Vendor.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

export const VendorServices = {
  getAllVendorsFromDB,
  getVendorProfileFromDB,
  getVendorUserByIdFromDB,
  updateVendorProfileIntoDB,
  chooseOfferIntoDB,
};
