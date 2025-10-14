// src/app/modules/follow/follow.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import { FollowService } from './follow.service';

const followUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = (req as any).user._id;
  const { userId } = req.params;

  const result = await FollowService.followUser(followerId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
  const followerId = (req as any).user._id;
  const { userId } = req.params;

  const result = await FollowService.unfollowUser(followerId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
  });
});

const getFollowers = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const followers = await FollowService.getFollowers(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Followers fetched successfully',
    data: followers,
  });
});

const getFollowing = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const following = await FollowService.getFollowing(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Following fetched successfully',
    data: following,
  });
});

export const FollowController = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
