import mongoose, { Types } from 'mongoose';
import AppError from '../../errors/AppError';
import { deleteFromS3, uploadToS3 } from '../../utils/awsS3FileUploader';
import { User } from '../user/user.model';
import { TVendor } from './vendor.interface';
import { Vendor } from './vendor.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { vendorSearchableFields } from './vendor.constant';
import { Product } from '../product/product.model';
import { Packages } from '../packages/packages.model';
import { Payment } from '../payment/payment.model';

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
  profileFile?: Express.Multer.File,
  coverFile?: Express.Multer.File,
) => {
  // 🔍 Step 1: Check if vendor exists & get userId
  const existingVendor = await Vendor.findOne({ email }).select(
    'userId image coverImage',
  );
  if (!existingVendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 📸 Step 2: Handle profile image upload
    if (profileFile) {
      const uploadedProfileUrl = await uploadToS3({
        file: profileFile,
        fileName: `images/user/profile/${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`,
      });

      // 🧹 Delete old profile image if exists
      if (existingVendor.image) {
        await deleteFromS3(existingVendor.image);
      }

      payload.image = uploadedProfileUrl as string;
    }

    // 📸 Step 3: Handle cover image upload
    if (coverFile) {
      const uploadedCoverUrl = await uploadToS3({
        file: coverFile,
        fileName: `images/user/cover/${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000,
        )}`,
      });

      // 🧹 Delete old cover image if exists
      if (existingVendor.coverImage) {
        await deleteFromS3(existingVendor.coverImage);
      }

      payload.coverImage = uploadedCoverUrl as string;
    }

    // 📝 Step 4: Update linked User
    const updatedUser = await User.findByIdAndUpdate(
      existingVendor.userId,
      { $set: { ...payload } },
      { new: true, runValidators: true, session },
    );

    if (!updatedUser) {
      throw new AppError(400, 'Failed to update Vendor');
    }

    // 📝 Step 5: Update Vendor
    const updatedVendor = await Vendor.findOneAndUpdate(
      { email },
      { $set: payload },
      { new: true, runValidators: true, session },
    );
    if (!updatedVendor) {
      throw new AppError(400, 'Failed to update vendor');
    }

    // ✅ Step 6: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'Vendor profile update failed');
  }
};

const chooseOfferIntoDB = async (
  id: string,
  payload: { chooseOffer: string },
) => {
  const result = await Vendor.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

const getVendorSummaryFromDB = async (vendorId: string) => {
  // 1️⃣ Check vendor existence
  const vendorExists = await Vendor.findById({
    _id: vendorId,
    isDeleted: false,
  });

  if (!vendorExists) {
    throw new Error('Vendor not found');
  }

  const vendorObjectId = new Types.ObjectId(vendorId);

  // 2️⃣ Total products count
  const totalProducts = await Product.countDocuments({
    vendor: vendorObjectId,
    isDeleted: false,
  });

  // 3️⃣ Total services count
  const totalServices = await Packages.countDocuments({
    vendor: vendorObjectId,
    isDeleted: false,
  });

  // 4️⃣ Total earnings from Payment collection
  const earningsData = await Payment.aggregate([
    {
      $match: {
        vendor: vendorObjectId,
        status: 'paid',
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$vendorAmount' },
      },
    },
  ]);

  const totalEarnings = earningsData.length ? earningsData[0].totalEarnings : 0;

  // 5️⃣ Return vendor summary
  return {
    vendorId,
    totalProducts,
    totalServices,
    totalEarnings,
  };
};

export const VendorServices = {
  getAllVendorsFromDB,
  getVendorProfileFromDB,
  getVendorUserByIdFromDB,
  updateVendorProfileIntoDB,
  chooseOfferIntoDB,
  getVendorSummaryFromDB,
};
