import moment from 'moment';
import config from '../../config';
import AppError from '../../errors/AppError';
import { verifyToken } from '../../utils/verifyToken';
import { User } from '../user/user.model';
import { TJwtPayload } from '../auth/auth.interface';
import { Secret } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { TVerifyOtp } from './otp.interface';
import { generateOtp } from '../../utils/generateOtp';
import { createToken } from '../auth/auth.utils';
import { sendEmail } from '../../utils/sendEmail';

const resendOtpIntoDB = async (email: string) => {
  // 1. Check if user exists
  const existingUser = await User.findOne({ email });
  if (!existingUser) throw new AppError(404, 'This user is not found!');
  if (existingUser.isDeleted) throw new AppError(403, 'This user is deleted!');
  if (existingUser.status === 'blocked')
    throw new AppError(403, 'This user is blocked!');

  // 3. Generate new OTP and expiration
  const otp = generateOtp();
  const expiresAt = moment().add(5, 'minutes').toDate();

  // 4. Update user's verification details in DB
  await User.findOneAndUpdate(
    { email },
    {
      verification: {
        otp,
        expiresAt,
        status: false,
      },
    },
  );

  // 5. Create JWT token
  const jwtPayload: TJwtPayload = {
    userId: existingUser._id,
    name: existingUser?.fullName,
    email: existingUser?.email,
    role: existingUser?.role,
    image: existingUser?.image,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '5m',
  );

  // 6. Send new OTP email
  await sendEmail(
    existingUser.email,
    'Your New OTP Code',
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
                  Please use the new code below to verify your email address.
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
                        🔒 &nbsp;If you did not request this code, please ignore this email. Do not share this OTP with anyone.
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

  return { accessToken };
};

const verifyOtp = async (token: string, otp: TVerifyOtp) => {
  if (!token) {
    throw new AppError(401, 'You are not authorized! Please Login.');
  }

  const decoded = verifyToken(token, config.jwt_access_secret as string);

  const { email } = decoded;

  const user = await User.findOne({ email: email }).select(
    'verification isVerified',
  );

  if (!user) {
    throw new AppError(404, 'This user is not found!');
  }

  if (user?.isDeleted === true) {
    throw new AppError(403, 'This user is deleted!');
  }

  if (user?.status === 'blocked') {
    throw new AppError(403, 'This user is blocked!');
  }

  const verifyExpiresAt = user?.verification?.expiresAt;
  if (new Date() > verifyExpiresAt) {
    throw new AppError(400, 'Otp has expired. Please resend it');
  }

  const verifyOtpCode = Number(user?.verification?.otp);
  if (Number(otp) !== verifyOtpCode) {
    throw new AppError(400, 'Otp did not match');
  }

  const updateUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        isVerified: user?.isVerified === false ? true : user?.isVerified,
        verification: {
          otp: 0,
          expiresAt: moment().add(3, 'minute'),
          status: true,
        },
      },
    },
    { new: true },
  );

  // create token and sent to the client
  const jwtPayload: TJwtPayload = {
    userId: user._id.toString(),
    email: user?.email,
    role: user?.role,
  };

  const jwtToken = jwt.sign(jwtPayload, config.jwt_access_secret as Secret, {
    expiresIn: '3m',
  });

  return { user: updateUser, token: jwtToken };
};

export const OtpServices = {
  resendOtpIntoDB,
  verifyOtp,
};
