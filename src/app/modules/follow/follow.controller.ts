import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FollowServices } from './follow.service';

const followVendor = catchAsync(async (req: Request, res: Response) => {
  const followerId = req.user.userId;
  const { vendorId } = req.params;

  const result = await FollowServices.followVendorIntoDB(followerId, vendorId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Vendor followed successfully',
    data: result,
  });
});

const unfollowVendor = catchAsync(async (req: Request, res: Response) => {
  const followerId = req.user.userId;
  const { vendorId } = req.params;

  const result = await FollowServices.unfollowVendorFromDB(
    followerId,
    vendorId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Vendor unfollowed successfully',
    data: result,
  });
});

const getVendorFollowersCount = catchAsync(
  async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const currentUserId = req.user?.userId;

    const result = await FollowServices.getVendorFollowersCountFromDB(
      vendorId,
      currentUserId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Followers count retrieved successfully',
      data: result,
    });
  },
);

export const FollowControllers = {
  followVendor,
  unfollowVendor,
  getVendorFollowersCount,
};
