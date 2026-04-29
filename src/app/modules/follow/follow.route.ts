import express from 'express';
import auth from '../../middlewares/auth';
import { FollowControllers } from './follow.controller';

const router = express.Router();

router.post(
  '/:vendorId/follow',
  auth('user', 'vendor', 'team_member'),
  FollowControllers.followVendor,
);

router.delete(
  '/:vendorId/unfollow',
  auth('user', 'vendor'),
  FollowControllers.unfollowVendor,
);

router.get(
  '/:vendorId/followers',
  auth('user', 'vendor', 'team_member'),
  FollowControllers.getVendorFollowersCount,
);

export const FollowRoutes = router;
