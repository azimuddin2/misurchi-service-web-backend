import AppError from '../../errors/AppError';
import { Follow } from './follow.model';
import { User } from '../user/user.model';
import mongoose from 'mongoose';
import { Vendor } from '../vendor/vendor.model';

const followVendorIntoDB = async (followerId: string, vendorId: string) => {
  if (followerId === vendorId) {
    throw new AppError(400, 'You cannot follow yourself');
  }

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid vendor ID');
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  const user = await User.findById(vendor.userId);
  if (user?.role !== 'vendor') {
    throw new AppError(400, 'The associated user is not a vendor');
  }

  const alreadyFollowed = await Follow.findOne({
    follower: followerId,
    vendor: vendorId,
  });
  if (alreadyFollowed) {
    throw new AppError(400, 'Already following this vendor');
  }

  const result = await Follow.create({
    follower: followerId,
    vendor: vendorId,
  });
  const followersCount = await Follow.countDocuments({ vendor: vendorId });

  return { result, followersCount };
};

const unfollowVendorFromDB = async (followerId: string, vendorId: string) => {
  const followDoc = await Follow.findOne({
    follower: followerId,
    vendor: vendorId,
  });
  if (!followDoc) {
    throw new AppError(404, 'You are not following this vendor');
  }

  await Follow.findByIdAndDelete(followDoc._id);
  const followersCount = await Follow.countDocuments({ vendor: vendorId });

  return { message: 'Unfollowed successfully', followersCount };
};

const getVendorFollowersCountFromDB = async (
  vendorId: string,
  currentUserId?: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError(400, 'Invalid vendor ID');
  }

  const followersCount = await Follow.countDocuments({ vendor: vendorId });

  // ✅ Now this will correctly detect current user’s follow status
  let isFollowing = false;
  if (currentUserId) {
    const followDoc = await Follow.findOne({
      follower: currentUserId,
      vendor: vendorId,
    });
    isFollowing = !!followDoc;
  }

  return { vendorId, followersCount, isFollowing };
};

export const FollowServices = {
  followVendorIntoDB,
  unfollowVendorFromDB,
  getVendorFollowersCountFromDB,
};
