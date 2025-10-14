// services/follow.service.ts

import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { User } from '../user/user.model';

// Helper to get user by ID or handle
const getUserByIdentifier = async (identifier: string) => {
  if (mongoose.Types.ObjectId.isValid(identifier))
    return User.findById(identifier);
  return User.findOne({ handle: identifier.toLowerCase() });
};

// Follow a user
const followUserIntoDB = async (
  followerId: string,
  targetIdentifier: string,
) => {
  const follower = await getUserByIdentifier(followerId);
  const target = await getUserByIdentifier(targetIdentifier);

  if (!follower || !target)
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  if (follower._id.equals(target._id))
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot follow yourself');
  if (follower.following.includes(target._id))
    throw new AppError(httpStatus.BAD_REQUEST, 'Already following this user');

  follower.following.push(target._id);
  target.followers.push(follower._id);

  await follower.save();
  await target.save();

  return {
    message: `You are now following ${target.handle}`,
    followerId: follower._id,
    followingId: target._id,
  };
};

// Unfollow a user
const unfollowUserFromDB = async (
  followerId: string,
  targetIdentifier: string,
) => {
  const follower = await getUserByIdentifier(followerId);
  const target = await getUserByIdentifier(targetIdentifier);

  if (!follower || !target)
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  if (!follower.following.includes(target._id))
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You are not following this user',
    );

  follower.following = follower.following.filter(
    (id) => !id.equals(target._id),
  );
  target.followers = target.followers.filter((id) => !id.equals(follower._id));

  await follower.save();
  await target.save();

  return { message: `You have unfollowed ${target.handle}` };
};

// Get followers
const getFollowersFromDB = async (identifier: string) => {
  const user = await getUserByIdentifier(identifier);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const followers = await User.find({ _id: { $in: user.followers } }).select(
    'firstName lastName handle image',
  );

  return followers;
};

// Get following
const getFollowingFromDB = async (identifier: string) => {
  const user = await getUserByIdentifier(identifier);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const following = await User.find({ _id: { $in: user.following } }).select(
    'firstName lastName handle image',
  );

  return following;
};

export const FollowServices = {
  followUserIntoDB,
  unfollowUserFromDB,
  getFollowersFromDB,
  getFollowingFromDB,
};
