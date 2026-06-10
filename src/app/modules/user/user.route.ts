import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidations } from './user.validation';
import { UserControllers } from './user.controller';
import { VendorValidations } from '../vendor/vendor.validation';
import auth from '../../middlewares/auth';
import multer, { memoryStorage } from 'multer';
import parseData from '../../middlewares/parseData';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/buyer/signup',
  validateRequest(UserValidations.registerUserValidationSchema),
  UserControllers.registerUser,
);

router.post(
  '/vendor/signup',
  validateRequest(VendorValidations.vendorRegisterUserValidationSchema),
  UserControllers.vendorRegisterUser,
);

router.get(
  '/',
  auth('admin', 'user', 'vendor', 'team_member'),
  UserControllers.getAllUsers,
);

router.get(
  '/profile/:email',
  auth('user', 'vendor', 'team_member', 'admin'),
  UserControllers.getUserProfile,
);

router.patch(
  '/profile/:email',
  auth('user', 'admin'),
  upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  parseData(),
  validateRequest(UserValidations.updateUserValidationSchema),
  UserControllers.updateUserProfile,
);

router.get(
  '/:id',
  auth('user', 'vendor', 'admin', 'team_member'),
  UserControllers.getUserById,
);

router.put(
  '/change-status/:id',
  auth('admin'),
  validateRequest(UserValidations.changeStatusValidationSchema),
  UserControllers.changeStatus,
);

router.patch(
  '/update-notifications',
  auth('admin', 'user', 'vendor', 'team_member'),
  validateRequest(UserValidations.notificationSettingsValidationSchema),
  UserControllers.updateNotificationSettings,
);

router.delete(
  '/',
  auth('user', 'vendor', 'team_member'),
  UserControllers.deleteUserAccount,
);

export const UserRoutes = router;
