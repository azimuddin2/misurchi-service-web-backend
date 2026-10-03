import AppError from '../../errors/AppError';
import {
  TChangePassword,
  TJwtPayload,
  TLoginUser,
  TResetPassword,
} from './auth.interface';
import config from '../../config';
import { User } from '../user/user.model';
import { verifyToken } from '../../utils/verifyToken';
import { createToken } from './auth.utils';
import { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { generateOtp } from '../../utils/generateOtp';
import moment from 'moment';
import { sendEmail } from '../../utils/sendEmail';
import { Vendor } from '../vendor/vendor.model';
import { TeamMember } from '../teamMember/teamMember.model';
import { TTeamMemberRole } from '../teamMember/teamMember.interface';
import { Login_With, USER_ROLE } from '../user/user.constant';

const loginUser = async (payload: TLoginUser) => {
  const user = await User.findOne({ email: payload.email });

  if (!user) throw new AppError(404, 'This user is not found!');
  if (user.isDeleted)
    throw new AppError(
      403,
      'Your account has been deactivated. For assistance, please contact our support team.',
    );
  if (user.status === 'blocked')
    throw new AppError(
      403,
      'Your account has been blocked. For assistance, please contact our support team.',
    );

  const isPasswordMatched = await User.isPasswordMatched(
    payload.password,
    user.password,
  );
  if (!isPasswordMatched) throw new AppError(403, 'Password do not matched!');

  let vendorId: string | undefined = undefined;
  let vendorEmail: string | undefined = undefined;
  let permissions: string[] = [];
  let teamRole: TTeamMemberRole | undefined = undefined;

  // ✅ vendor vendorId and vendorEmail
  if (user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: user._id }).select(
      '_id email',
    );
    vendorId = vendor?._id.toString();
    vendorEmail = vendor?.email;
  }

  // ✅ team_member extra fields
  if (user.role === 'team_member') {
    const teamMember = await TeamMember.findOne({
      user: user._id,
      isActive: true,
      isDeleted: false,
    })
      .select('permissions vendor role')
      .populate('vendor', 'email');

    vendorId = (teamMember?.vendor as any)?._id.toString();
    vendorEmail = (teamMember?.vendor as any)?.email;
    permissions = teamMember?.permissions ?? [];
    teamRole = teamMember?.role;
  }

  const jwtPayload: TJwtPayload = {
    userId: user._id.toString(),
    name: user.fullName,
    email: user.email,
    role: user.role,
    image: user.image,
    vendorId,
    vendorEmail,
    permissions,
    teamRole,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return { accessToken, refreshToken };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(401, 'You are not authorized! Please Login');
  }

  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  const { email } = decoded;

  const user = await User.findOne({ email });

  if (!user) throw new AppError(404, 'This user is not found!');
  if (user?.isDeleted)
    throw new AppError(
      403,
      'Your account has been deactivated. For assistance, please contact our support team.',
    );
  if (user?.status === 'blocked')
    throw new AppError(
      403,
      'Your account has been blocked. For assistance, please contact our support team.',
    );

  let vendorId: string | undefined = undefined;
  let vendorEmail: string | undefined = undefined;
  let permissions: string[] = [];
  let teamRole: TTeamMemberRole | undefined = undefined;

  // ✅ vendor vendorId and vendorEmail
  if (user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: user._id }).select(
      '_id email',
    );
    vendorId = vendor?._id.toString();
    vendorEmail = vendor?.email;
  }

  // ✅ team_member extra fields
  if (user.role === 'team_member') {
    const teamMember = await TeamMember.findOne({
      user: user._id,
      isActive: true,
      isDeleted: false,
    })
      .select('permissions vendor role')
      .populate('vendor', 'email');

    vendorId = (teamMember?.vendor as any)?._id.toString();
    vendorEmail = (teamMember?.vendor as any)?.email;
    permissions = teamMember?.permissions ?? [];
    teamRole = teamMember?.role;
  }

  const jwtPayload: TJwtPayload = {
    userId: user._id.toString(),
    name: user.fullName,
    email: user.email,
    role: user.role,
    image: user.image,
    vendorId,
    vendorEmail,
    permissions,
    teamRole,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return { accessToken };
};

const changePassword = async (
  userData: JwtPayload,
  payload: TChangePassword,
) => {
  const user = await User.isUserExistsByEmail(userData?.email);

  if (!user) {
    throw new AppError(404, 'This user is not found!');
  }

  if (user?.isDeleted === true) {
    throw new AppError(
      403,
      'Your account has been deactivated. For assistance, please contact our support team.',
    );
  }

  if (user?.status === 'blocked') {
    throw new AppError(
      403,
      'Your account has been blocked. For assistance, please contact our support team.',
    );
  }

  // checking if the password is correct
  const isPasswordMatched = await User.isPasswordMatched(
    payload?.oldPassword,
    user?.password,
  );
  if (!isPasswordMatched) {
    throw new AppError(403, 'Password do not matched!');
  }

  // hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await User.findOneAndUpdate(
    {
      _id: userData.userId,
      role: userData.role,
    },
    {
      password: newHashedPassword,
      needsPasswordChange: true,
      passwordChangeAt: new Date(),
    },
  );

  // 🔒 Security notification email
  const changedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const emailHtml = `
    <div style="background:#f0f4ff; padding:28px; font-family:Arial,sans-serif;">
      <div style="max-width:560px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Top banner -->
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:32px 36px 28px; text-align:center;">
          <div style="width:56px; height:56px; background:rgba(255,255,255,0.15); border-radius:50%; margin:0 auto 14px; display:flex; align-items:center; justify-content:center;">
            🔐
          </div>
          <h1 style="margin:0 0 6px; font-size:22px; font-weight:700; color:#fff;">Password Updated Successfully</h1>
          <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.8);">Your account is secure and up to date</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 36px;">

          <p style="font-size:16px; color:#1a1a1a; margin:0 0 6px; font-weight:600;">Hey ${user.fullName || 'there'}! 👋</p>
          <p style="font-size:14px; color:#555; line-height:1.8; margin:0 0 24px;">
            Your password has been updated successfully.<br/>
            If this was you, you're all good — no further action needed.<br/>
            If you didn't make this change, please contact us right away so we can protect your account.
          </p>

          <!-- Time info -->
          <div style="background:#f8f9ff; border:1px solid #e0e4ff; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
            <p style="margin:0 0 10px; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.6px; font-weight:600;">Change details</p>
            <p style="margin:0; font-size:14px; color:#333; font-weight:500;">🕐 ${changedAt}</p>
          </div>

          <!-- Divider -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
            <div style="flex:1; height:1px; background:#f0f0f0;"></div>
            <span style="font-size:12px; color:#bbb; white-space:nowrap;">Wasn't you?</span>
            <div style="flex:1; height:1px; background:#f0f0f0;"></div>
          </div>

          <!-- Warning -->
          <div style="background:#fffbf0; border:1px solid #ffe4a0; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
            <p style="margin:0 0 5px; font-size:14px; font-weight:700; color:#92400e;">🔔 Don't worry, we've got you!</p>
            <p style="margin:0; font-size:13px; color:#78350f; line-height:1.7;">
              If you didn't make this change, your account might be at risk. Tap the button below and our team will help you right away.
            </p>
          </div>

          <!-- CTA button -->
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <a href="${config.client_Url}/contact"
               style="flex:1; min-width:140px; display:inline-block; background:#f3f4ff; color:#4f46e5; padding:12px 20px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600; text-align:center; border:1px solid #ddd;">
              Contact Support
            </a>
          </div>

          <!-- Security tips -->
          <div style="margin-top:28px; background:#f9fafb; border-radius:10px; padding:16px 20px;">
            <p style="margin:0 0 12px; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.6px; font-weight:600;">Quick security tips</p>
            <p style="margin:0 0 8px; font-size:13px; color:#555;">✓ Use a unique password for every account</p>
            <p style="margin:0 0 8px; font-size:13px; color:#555;">✓ Enable two-factor authentication</p>
            <p style="margin:0; font-size:13px; color:#555;">✓ Never share your password with anyone</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8f9ff; padding:20px 36px; text-align:center; border-top:1px solid #eef0ff;">
          <p style="margin:0; font-size:12px; color:#bbb;">&copy; ${new Date().getFullYear()} · This is an automated security alert · Please do not reply</p>
        </div>

      </div>
    </div>
  `;

  await sendEmail(user.email, 'Your password has been changed', emailHtml);

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(404, 'This user is not found!');
  }

  if (user?.isDeleted === true) {
    throw new AppError(
      403,
      'Your account has been deactivated. For assistance, please contact our support team.',
    );
  }

  if (user?.status === 'blocked') {
    throw new AppError(
      403,
      'Your account has been blocked. For assistance, please contact our support team.',
    );
  }

  // create token and sent to the client
  const jwtPayload: TJwtPayload = {
    userId: user._id.toString(),
    name: user?.fullName,
    email: user?.email,
    role: user?.role,
    image: user?.image,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '2m',
  );

  const currentTime = new Date();
  const otp = generateOtp();
  const expiresAt = moment(currentTime).add(5, 'minute');
  await User.findByIdAndUpdate(user?._id, {
    verification: {
      otp,
      expiresAt,
      status: true,
      isPasswordReset: true,
    },
  });

  await sendEmail(
    email,
    'Your OTP for Password Reset',
    `
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f3f4f6;">
    Your password reset code is ${otp}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:12px; border:1px solid #e5e7eb; border-top:4px solid #1A73E8;">

          <tr>
            <td style="padding:40px 40px 8px; font-family:Arial, Helvetica, sans-serif;">
              <h1 style="margin:0 0 14px; font-size:24px; line-height:32px; font-weight:700; color:#111827;">
                Reset your password
              </h1>
              <p style="margin:0; font-size:15px; line-height:24px; color:#4b5563;">
                We received a request to reset the password for your account.
                Enter the one-time password below to continue.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background-color:#f0f6ff; border:1px solid #d6e6ff; border-radius:10px; padding:26px 16px;">
                    <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6b7280; margin-bottom:10px;">
                      Your OTP
                    </div>
                    <div style="font-family:'Courier New', Courier, monospace; font-size:38px; line-height:44px; font-weight:700; letter-spacing:10px; color:#1A73E8; padding-left:10px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 32px; font-family:Arial, Helvetica, sans-serif;">
              <p style="margin:0 0 6px; font-size:14px; line-height:22px; color:#6b7280;">
                This OTP is valid until
              </p>
              <p style="margin:0; font-size:15px; line-height:22px; font-weight:700; color:#111827;">
                ${expiresAt.toLocaleString()}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#fff8e6; border-left:4px solid #f5a623; border-radius:6px; padding:14px 16px; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#7a5b00;">
                    <strong>Never share this code with anyone.</strong> We will never ask you for your OTP.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb; border-top:1px solid #e5e7eb; border-radius:0 0 12px 12px; padding:22px 40px; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#9ca3af; text-align:center;">
              If you did not request this, please ignore this email. Your password will not change.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
  `,
  );

  return { email, accessToken };
};

const resetPassword = async (token: string, payload: TResetPassword) => {
  if (!token) {
    throw new AppError(401, 'You are not authorized!');
  }

  const decoded = verifyToken(token, config.jwt_access_secret as string);

  const { userId, email } = decoded;

  const user = await User.findOne({ email: email }).select(
    'verification isVerified',
  );

  if (!user) {
    throw new AppError(404, 'This user is not found!');
  }

  if (user?.isDeleted === true) {
    throw new AppError(
      403,
      'Your account has been deactivated. For assistance, please contact our support team.',
    );
  }

  if (user?.status === 'blocked') {
    throw new AppError(
      403,
      'Your account has been blocked. For assistance, please contact our support team.',
    );
  }

  const verifyExpiresAt = user?.verification?.expiresAt;
  if (new Date() > verifyExpiresAt) {
    throw new AppError(400, 'otp has expired. Please resend it');
  }

  if (!user?.verification?.status) {
    throw new AppError(400, 'Otp is not verified yet!');
  }

  const hashedPassword = await bcrypt.hash(
    payload?.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    passwordChangedAt: new Date(),
    verification: {
      otp: 0,
      status: false,
    },
  });

  return result;
};

const googleLogin = async (payload: {
  email: string;
  fullName: string;
  picture?: string;
}) => {
  if (!payload?.email || !payload?.fullName) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email and name are required');
  }

  /* __________________ CHECK USER EXISTS __________________ */
  const existingUser = await User.isUserExistsByEmail(payload.email);

  /* __________________ EXISTING USER LOGIN __________________ */
  if (existingUser) {
    if (existingUser.isDeleted) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your account has been deactivated. For assistance, please contact our support team.',
      );
    }
    if (existingUser.status === 'blocked') {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Your account has been blocked. For assistance, please contact our support team.',
      );
    }

    let vendorId: string | undefined = undefined;
    let vendorEmail: string | undefined = undefined;
    let permissions: string[] = [];
    let teamRole: TTeamMemberRole | undefined = undefined;

    // ✅ If you are a vendor, attach vendor Id/vendor Email.
    if (existingUser.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: existingUser._id }).select(
        '_id email',
      );
      vendorId = vendor?._id.toString();
      vendorEmail = vendor?.email;
    }

    // ✅ If team_member, attach permissions/team Role
    if (existingUser.role === 'team_member') {
      const teamMember = await TeamMember.findOne({
        user: existingUser._id,
        isActive: true,
        isDeleted: false,
      })
        .select('permissions vendor role')
        .populate('vendor', 'email');

      if (!teamMember) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'Your team member access is inactive. Please contact your vendor.',
        );
      }

      vendorId = (teamMember?.vendor as any)?._id.toString();
      vendorEmail = (teamMember?.vendor as any)?.email;
      permissions = teamMember?.permissions ?? [];
      teamRole = teamMember?.role;
    }

    /* __________________ CREATE JWT __________________ */
    const jwtPayload: TJwtPayload = {
      userId: existingUser._id.toString(),
      name: existingUser.fullName,
      email: existingUser.email,
      role: existingUser.role,
      image: existingUser.image,
      vendorId,
      vendorEmail,
      permissions,
      teamRole,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret!,
      config.jwt_access_expires_in!,
    );
    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret!,
      config.jwt_refresh_expires_in!,
    );

    return { user: existingUser, accessToken, refreshToken };
  }

  /* __________________ NEW USER CREATE (Just the normal 'user' role) __________________ */
  const newUser = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    phone: null,
    role: USER_ROLE.user,
    loginWith: Login_With.google,
    isVerified: true,
    verification: { status: true },
    image: payload?.picture || null,
  });

  /* __________________ CREATE JWT FOR NEW USER __________________ */
  const jwtPayload: TJwtPayload = {
    userId: newUser._id.toString(),
    name: newUser.fullName,
    email: newUser.email,
    role: newUser.role,
    image: newUser.image,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret!,
    config.jwt_access_expires_in!,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret!,
    config.jwt_refresh_expires_in!,
  );

  return { user: newUser, accessToken, refreshToken };
};

export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
};
