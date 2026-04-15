import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { TVendor } from '../vendor/vendor.interface';
import { TUser } from './user.interface';
import { User } from './user.model';
import { Vendor } from '../vendor/vendor.model';
import { generateOtp } from '../../utils/generateOtp';
import moment from 'moment';
import config from '../../config';
import { sendEmail } from '../../utils/sendEmail';
import { TJwtPayload } from '../auth/auth.interface';
import { createToken } from '../auth/auth.utils';
import QueryBuilder from '../../builder/QueryBuilder';
import { userSearchableFields } from './user.constant';
import { deleteFromS3, uploadToS3 } from '../../utils/awsS3FileUploader';
import { Subscription } from '../subscription/subscription.model';

const registerUserIntoDB = async (payload: TUser) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(409, `${payload.email} already exists.`);
  }

  // 2. Check if passwords match
  if (payload.password !== payload.confirmPassword) {
    throw new AppError(400, 'Passwords do not match.');
  }

  // 3. Generate OTP and expiration
  const otp = generateOtp();
  const expiresAt = moment().add(3, 'minutes').toDate();

  // 4. Prepare data with verification details
  const userData: Partial<TUser> = {
    ...payload,
    isVerified: false,
    verification: {
      otp,
      expiresAt,
      status: false,
    },
  };

  // 5. Create user in DB
  const result = await User.create(userData);

  // 6. Create JWT token (optional for next step)
  const jwtPayload: TJwtPayload = {
    userId: result._id,
    name: result?.fullName,
    email: result?.email,
    role: result?.role,
    image: result?.image,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '5m',
  );

  // 7. Send OTP email
  await sendEmail(
    result.email,
    'Your OTP Code',
    `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h2 style="color: #007BFF; margin: 0;">Verify Your Email</h2>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; color: #333333; padding-bottom: 20px; text-align: center;">
                <p style="margin: 0;">Use the OTP below to verify your email address and complete your registration:</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0;">
                <div style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #ffffff; background-color: #007BFF; border-radius: 6px; letter-spacing: 2px;">
                  ${otp}
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #666666; text-align: center; padding-bottom: 20px;">
                <p style="margin: 0;">This code is valid until <strong>${expiresAt.toLocaleString()}</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #999999; text-align: center;">
                <p style="margin: 0;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 30px; text-align: center;">
                <p style="font-size: 12px; color: #cccccc; margin: 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
  );

  const res = await Subscription.create();
  console.log('create subscription initialy', res);

  return { accessToken };
};

const vendorRegisterUserIntoDB = async (payload: TVendor) => {
  if (payload.password !== payload.confirmPassword) {
    throw new AppError(400, 'Passwords do not match!');
  }

  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(409, `${payload.email} already exists.`);
  }

  const otp = generateOtp();
  const expiresAt = moment().add(3, 'minutes').toDate();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userData = {
      ...payload,
      role: 'vendor',
      isVerified: false,
      verification: {
        otp,
        expiresAt,
        status: false,
      },
    };

    const createdUser = await User.create([userData], { session });
    if (!createdUser.length) {
      throw new AppError(400, 'Failed to create user');
    }

    const vendorData = {
      ...payload,
      userId: createdUser?.map((user) => user._id),
    };

    const createdVendor = await Vendor.create([vendorData], { session });
    if (!createdVendor.length) {
      throw new AppError(400, 'Failed to create vendor');
    }

    // ✅ Generate JWT Token
    const jwtPayload: TJwtPayload = {
      userId: createdUser[0]._id,
      name: createdUser[0].fullName,
      email: createdUser[0].email,
      role: createdUser[0].role,
      image: createdUser[0].image,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      '5m',
    );

    // ✅ Send OTP Email
    await sendEmail(
      payload.email,
      'Your OTP Code',
      `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            <tr>
              <td align="center" style="padding-bottom: 20px;">
                <h2 style="color: #007BFF; margin: 0;">Verify Your Email</h2>
              </td>
            </tr>
            <tr>
              <td style="font-size: 16px; color: #333333; padding-bottom: 20px; text-align: center;">
                <p style="margin: 0;">Use the OTP below to verify your email address and complete your registration:</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0;">
                <div style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #ffffff; background-color: #007BFF; border-radius: 6px; letter-spacing: 2px;">
                  ${otp}
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #666666; text-align: center; padding-bottom: 20px;">
                <p style="margin: 0;">This code is valid until <strong>${expiresAt.toLocaleString()}</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #999999; text-align: center;">
                <p style="margin: 0;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 30px; text-align: center;">
                <p style="font-size: 12px; color: #cccccc; margin: 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ Return both vendor and token if needed
    return {
      // vendor: createdVendor[0],
      accessToken,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'Vendor registration failed');
  }
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const baseQuery = {
    ...query,
    isDeleted: false,
    role: { $nin: ['admin'] }, // ✅ exclude admins
  };

  const queryBuilder = new QueryBuilder(User.find(), baseQuery)
    .search(userSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getUserProfileFromDB = async (email: string) => {
  const result = await User.findOne({ email: email });

  // if (!result) {
  //   throw new AppError(404, 'This user not found');
  // }

  return result;
};

const updateUserProfileIntoDB = async (
  email: string,
  payload: Partial<TUser>,
  profileFile?: Express.Multer.File,
  coverFile?: Express.Multer.File,
) => {
  // 🔍 Step 1: Check if user exists
  const existingUser = await User.findOne({ email }).select(
    '_id image coverImage',
  );
  if (!existingUser) {
    throw new AppError(404, 'User not found');
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

      if (existingUser.image) {
        await deleteFromS3(existingUser.image);
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

      if (existingUser.coverImage) {
        await deleteFromS3(existingUser.coverImage);
      }

      payload.coverImage = uploadedCoverUrl as string;
    }

    // ✅ 🔥 Location handling (same as vendor)
    const { location, ...restPayload } = payload as any;

    const updateData: Record<string, any> = { ...restPayload };

    if (location?.coordinates?.length === 2) {
      updateData['location.type'] = 'Point';
      updateData['location.coordinates'] = location.coordinates;
      updateData['location.streetAddress'] = location.streetAddress || '';
    }

    // 📝 Step 4: Update User
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      { $set: updateData },
      { new: true, runValidators: true, session },
    );

    if (!updatedUser) {
      throw new AppError(400, 'Failed to update user');
    }

    // ✅ Step 5: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'User profile update failed');
  }
};

const getUserByIdFromDB = async (id: string) => {
  const result = await User.findById(id);

  if (!result) {
    throw new AppError(404, 'This user not found');
  }

  return result;
};

const changeStatusIntoDB = async (id: string, payload: { status: string }) => {
  const result = await User.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    throw new AppError(404, 'User not found');
  }

  return result;
};

const updateNotificationSettingsIntoDB = async (
  email: string,
  notifications: boolean,
) => {
  // 🔍 Step 1: Check if user exists & get email
  const existingUser = await User.findOne({ email }).select('');
  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  if (existingUser?.isDeleted === true) {
    throw new AppError(403, 'This user account is deleted!');
  }

  if (existingUser?.status === 'blocked') {
    throw new AppError(403, 'This user is blocked!');
  }

  const updatedUser = await User.findOneAndUpdate(
    { email: email },
    { notifications },
    {
      new: true,
      runValidators: true,
    },
  ).select('email notifications fullName');

  if (!updatedUser) {
    throw new AppError(400, 'Notification settings update failed');
  }

  return updatedUser;
};

export const UserServices = {
  registerUserIntoDB,
  vendorRegisterUserIntoDB,
  getAllUsersFromDB,
  getUserProfileFromDB,
  updateUserProfileIntoDB,
  getUserByIdFromDB,
  changeStatusIntoDB,
  updateNotificationSettingsIntoDB,
};
