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
import { Referral } from '../referral/referral.model';

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
    '30m',
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
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f0; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,168,76,0.1);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #0AA84C 0%, #078a3e 100%); padding: 40px 40px 30px;">
                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">✉️</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Email Verification</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Secure OTP Authentication</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                
                <p style="font-size: 15px; color: #444444; margin: 0 0 24px; line-height: 1.6; text-align: center;">
                 Please use the code below to verify your email address.
                </p>

                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td align="center">
                      <div style="display: inline-block; background: linear-gradient(135deg, #0AA84C 0%, #078a3e 100%); border-radius: 10px; padding: 20px 50px;">
                        <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Your OTP Code</p>
                        <p style="margin: 0; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Expiry Notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fdf9; border: 1px solid #d4f0e0; border-radius: 8px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #555555;">
                        ⏱️ &nbsp;This code expires at &nbsp;<strong style="color: #0AA84C;">${expiresAt.toLocaleString()}</strong>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Security Notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f0; border-left: 4px solid #0AA84C; border-radius: 4px; margin-bottom: 8px;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
                        🔒 &nbsp;If yoanyoneu did not request this code, please ignore this email. Do not share this OTP with .
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fdf9; border-top: 1px solid #e8f5ee; padding: 20px 40px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #aaaaaa; line-height: 1.6;">
                  &copy; ${new Date().getFullYear()} <strong style="color: #0AA84C;">Scott Clements</strong>. All rights reserved.<br/>
                  This is an automated message, please do not reply.
                </p>
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

const vendorRegisterUserIntoDB = async (payload: TVendor, refCode?: string) => {
  if (payload.password !== payload.confirmPassword) {
    throw new AppError(400, 'Passwords do not match!');
  }

  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new AppError(409, `${payload.email} already exists.`);
  }

  const otp = generateOtp();
  const expiresAt = moment().add(5, 'minutes').toDate();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const createdUser = await User.create(
      [
        {
          ...payload,
          role: 'vendor',
          isVerified: false,
          verification: { otp, expiresAt, status: false },
        },
      ],
      { session },
    );
    if (!createdUser.length) {
      throw new AppError(400, 'Failed to create user');
    }

    const createdVendor = await Vendor.create(
      [
        {
          ...payload,
          userId: createdUser[0]._id,
        },
      ],
      { session },
    );
    if (!createdVendor.length) {
      throw new AppError(400, 'Failed to create vendor');
    }

    // ✅ User document vendorId set
    await User.findByIdAndUpdate(
      createdUser[0]._id,
      { vendorId: createdVendor[0]._id },
      { session },
    );

    // ✅ Referral logic
    if (refCode) {
      const referrer = await Vendor.findOne({ referralCode: refCode });
      if (referrer) {
        await Referral.create(
          [
            {
              referrerId: referrer._id,
              referredUserId: createdVendor[0]._id,
              businessName: payload.businessName,
              status: 'pending',
            },
          ],
          { session },
        );
      }
    }

    const jwtPayload: TJwtPayload = {
      userId: createdUser[0]._id,
      name: createdUser[0].fullName,
      email: createdUser[0].email,
      role: createdUser[0].role,
      image: createdUser[0].image,
      vendorId: createdVendor[0]._id.toString(),
      vendorEmail: createdVendor[0].email,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      '30m',
    );

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
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f0; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,168,76,0.1);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #0AA84C 0%, #078a3e 100%); padding: 40px 40px 30px;">
                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 28px;">✉️</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Email Verification</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Secure OTP Authentication</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                
                <p style="font-size: 15px; color: #444444; margin: 0 0 24px; line-height: 1.6; text-align: center;">
                 Please use the code below to verify your email address.
                </p>

                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                  <tr>
                    <td align="center">
                      <div style="display: inline-block; background: linear-gradient(135deg, #0AA84C 0%, #078a3e 100%); border-radius: 10px; padding: 20px 50px;">
                        <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.8); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Your OTP Code</p>
                        <p style="margin: 0; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Expiry Notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fdf9; border: 1px solid #d4f0e0; border-radius: 8px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 14px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 13px; color: #555555;">
                        ⏱️ &nbsp;This code expires at &nbsp;<strong style="color: #0AA84C;">${expiresAt.toLocaleString()}</strong>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Security Notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8f0; border-left: 4px solid #0AA84C; border-radius: 4px; margin-bottom: 8px;">
                  <tr>
                    <td style="padding: 12px 16px;">
                      <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.5;">
                        🔒 &nbsp;If yoanyoneu did not request this code, please ignore this email. Do not share this OTP with .
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fdf9; border-top: 1px solid #e8f5ee; padding: 20px 40px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #aaaaaa; line-height: 1.6;">
                  &copy; ${new Date().getFullYear()} <strong style="color: #0AA84C;">Scott Clements</strong>. All rights reserved.<br/>
                  This is an automated message, please do not reply.
                </p>
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

    return { accessToken };
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
    role: { $nin: ['admin'] },
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

const deleteUserAccountFromDB = async (userId: string) => {
  // 1️⃣ Check if user exists
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // 2️⃣ Mark account as deleted
  const deletedUser = await User.findByIdAndUpdate(
    userId,
    { isDeleted: true },
    { new: true },
  );
  if (!deletedUser) throw new AppError(400, 'Failed to delete user account');

  // 3️⃣ Send notification email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #FF4D4F;">Account Deleted</h2>
        <p>Hi ${deletedUser.fullName || 'User'},</p>
        <p>Your account has been successfully deleted as per your request or by admin action.</p>
        <p>If you did not request this action, please contact our support immediately.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #999999;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail(deletedUser.email, 'Account Deleted', emailHtml);

  return deletedUser;
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
  deleteUserAccountFromDB,
};
