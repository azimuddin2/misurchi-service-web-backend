import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.registerUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const vendorRegisterUser = catchAsync(async (req: Request, res: Response) => {
  const refCode = req.query.ref as string | undefined;

  const result = await UserServices.vendorRegisterUserIntoDB(req.body, refCode);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Vendor User registered successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const result = await UserServices.getUserProfileFromDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;

  // Access files from multer
  const profileFile = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.['profile']?.[0];
  const coverFile = (
    req.files as { [fieldname: string]: Express.Multer.File[] }
  )?.['coverImage']?.[0];

  const result = await UserServices.updateUserProfileIntoDB(
    email,
    req.body,
    profileFile,
    coverFile,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully.',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserServices.getUserByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserServices.changeStatusIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `User is ${result.status} successfully!`,
    data: result,
  });
});

const updateNotificationSettings = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.user;
    const { notifications } = req.body;

    const result = await UserServices.updateNotificationSettingsIntoDB(
      email,
      notifications,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notification settings updated successfully.',
      data: result,
    });
  },
);

const deleteUserAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const result = await UserServices.deleteUserAccountFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Your account has been deleted successfully.',
    data: result,
  });
});

const reactivateUserAccount = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserServices.reactivateUserAccountFromDB(id);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Account has been reactivated successfully.',
      data: result,
    });
  },
);

export const UserControllers = {
  registerUser,
  vendorRegisterUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  getUserById,
  changeStatus,
  updateNotificationSettings,
  deleteUserAccount,
  reactivateUserAccount,
};
