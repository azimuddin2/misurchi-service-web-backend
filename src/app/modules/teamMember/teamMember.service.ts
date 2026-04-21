import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { deleteFromS3, uploadToS3 } from '../../utils/awsS3FileUploader';
import { generateStrongPassword } from '../user/user.utils';
import { Vendor } from '../vendor/vendor.model';
import { TTeamMember } from './teamMember.interface';
import { TeamMember } from './teamMember.model';
import { User } from '../user/user.model';
import { sendEmail } from '../../utils/sendEmail';
import QueryBuilder from '../../builder/QueryBuilder';
import { teamMemberSearchableFields } from './teamMember.constant';

const createTeamMemberIntoDB = async (
  vendorUserId: string,
  payload: TTeamMember,
  file: any,
) => {
  // Find the vendor by the logged-in user's ID (from JWT)
  const vendor = await Vendor.findOne({ userId: vendorUserId });
  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  // 📸 Handle single image upload to S3
  if (file) {
    const uploadedUrl = await uploadToS3({
      file,
      fileName: `images/team/${Math.floor(100000 + Math.random() * 900000)}`,
    });
    payload.image = uploadedUrl as string;
  }

  // Generate a strong temporary password for new users
  const tempPassword = generateStrongPassword();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if a user with this email already exists in the system
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      // Case 2: normal user → reject (they have their own account)
      if (existingUser.role === 'user') {
        throw new AppError(
          409,
          `${payload.email} is already a registered user.`,
        );
      }

      // Case 3a: vendor → reject
      if (existingUser.role === 'vendor') {
        throw new AppError(
          409,
          `${payload.email} is already a registered vendor.`,
        );
      }

      // Case 3b: admin → reject
      if (existingUser.role === 'admin') {
        throw new AppError(409, `${payload.email} is already an admin.`);
      }

      // Case 4: already a team member of THIS vendor → reject
      if (existingUser.role === 'team_member') {
        const alreadyTeamMember = await TeamMember.findOne({
          user: existingUser._id,
          vendor: vendor._id,
        });
        if (alreadyTeamMember) {
          throw new AppError(
            409,
            `${payload.email} is already your team member.`,
          );
        }
      }
    }

    let userId: any;
    let shouldSendPassword = false;

    if (!existingUser) {
      // Case 1: No user found → create a brand new user with team_member role
      const createdUser = await User.create(
        [
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            phone: payload.phone ?? '',
            password: tempPassword,
            confirmPassword: tempPassword,
            role: 'team_member',
            needsPasswordChange: true, // Force password change on first login
            isVerified: true, // Skip OTP — vendor already verified them
            vendorId: vendor._id, // Link to this vendor
          },
        ],
        { session },
      );
      if (!createdUser.length) {
        throw new AppError(400, 'Failed to create user');
      }

      userId = createdUser[0]._id;
      shouldSendPassword = true; // Send temporary password via email
    } else {
      // Case 5: team_member of ANOTHER vendor → update vendorId only
      await User.findByIdAndUpdate(
        existingUser._id,
        {
          vendorId: vendor._id, // Switch to this vendor
          needsPasswordChange: false, // They already know their password
        },
        { session },
      );

      userId = existingUser._id;
      shouldSendPassword = false; // No need to send password
    }

    // Create the TeamMember document
    // Note: pre-save hook will auto-set permissions based on role
    const createdTeamMember = await TeamMember.create(
      [
        {
          vendor: vendor._id,
          user: userId,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          image: payload.image,
          role: payload.role,
          speciality: payload.speciality,
          timeZone: payload.timeZone,
          workHours: payload.workHours,
        },
      ],
      { session },
    );
    if (!createdTeamMember.length) {
      throw new AppError(400, 'Failed to create team member');
    }

    // Add the new team member reference to the vendor's teamMembers array
    await Vendor.findByIdAndUpdate(
      vendor._id,
      { $push: { teamMembers: createdTeamMember[0]._id } },
      { session },
    );

    if (shouldSendPassword) {
      // Case 1 — New user: send email with temporary credentials
      await sendEmail(
        payload.email,
        'You have been added as a team member',
        `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"/><title>Team Member Invitation</title></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;padding:40px;border-radius:8px;">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h2 style="color:#007BFF;margin:0;">You're added as a Team Member</h2>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:16px;color:#333;text-align:center;padding-bottom:20px;">
                    <p>You have been added as <strong>${payload.role}</strong> by <strong>${vendor.businessName}</strong>.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <div style="background:#f8f8f8;padding:20px;border-radius:6px;text-align:left;">
                      <p style="margin:0 0 8px;"><strong>Email:</strong> ${payload.email}</p>
                      <p style="margin:0 0 8px;"><strong>Temporary Password:</strong>
                        <span style="font-size:18px;font-weight:bold;color:#007BFF;letter-spacing:2px;">
                          ${tempPassword}
                        </span>
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#666;text-align:center;">
                    <p>Please change your password after first login.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:30px;text-align:center;">
                    <p style="font-size:12px;color:#ccc;margin:0;">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        `,
      );
    } else {
      // Case 5 — Existing team_member: notify without credentials
      await sendEmail(
        payload.email,
        'You have been added as a team member',
        `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"/><title>Team Member Invitation</title></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;padding:40px;border-radius:8px;">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h2 style="color:#007BFF;margin:0;">You're added as a Team Member</h2>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:16px;color:#333;text-align:center;padding-bottom:20px;">
                    <p>You have been added as <strong>${payload.role}</strong> by <strong>${vendor.businessName}</strong>.</p>
                    <p>Login with your existing credentials.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:30px;text-align:center;">
                    <p style="font-size:12px;color:#ccc;margin:0;">&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        `,
      );
    }

    await session.commitTransaction();
    session.endSession();

    return { teamMember: createdTeamMember[0] };
  } catch (error: any) {
    // Rollback all DB changes if anything fails
    await session.abortTransaction();
    session.endSession();
    throw new AppError(500, error.message || 'Failed to create team member');
  }
};

const getAllTeamMemberFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid user ID');
  }

  // Base query -> always exclude deleted teams
  let teamQuery = TeamMember.find({ vendor, isDeleted: false }).populate(
    'vendor',
  );

  const queryBuilder = new QueryBuilder(teamQuery, filters)
    .search(teamMemberSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getTeamMemberByIdFromDB = async (id: string) => {
  const result = await TeamMember.findById(id).populate('vendor');

  if (!result) {
    throw new AppError(404, 'This team member not found');
  }

  return result;
};

const updateTeamMemberIntoDB = async (
  id: string,
  payload: Partial<TTeamMember>,
  file?: Express.Multer.File,
) => {
  // 🔍 Step 1: Check if the team member exists
  const existingTeamMember = await TeamMember.findById(id);
  if (!existingTeamMember) {
    throw new AppError(404, 'Team member not found');
  }

  try {
    // 📸 Step 2: Handle new image upload
    if (file) {
      const uploadedUrl = await uploadToS3({
        file,
        fileName: `images/team/${Math.floor(100000 + Math.random() * 900000)}`,
      });

      // 🧹 Step 3: Delete the previous image from S3 (if exists)
      if (existingTeamMember.image) {
        await deleteFromS3(existingTeamMember.image);
      }

      // 📝 Step 4: Set the new image URL to payload
      payload.image = uploadedUrl as string;
    }

    // 🔄 Step 5: Update the team member in the database
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedTeamMember) {
      throw new AppError(400, 'Team member update failed');
    }

    return updatedTeamMember;
  } catch (error: any) {
    console.error('updateTeamMemberIntoDB Error:', error);
    throw new AppError(500, 'Failed to update team member');
  }
};

const deleteTeamMemberFromDB = async (id: string) => {
  const isTeamMemberExists = await TeamMember.findById(id);

  if (!isTeamMemberExists) {
    throw new AppError(404, 'Team member not found');
  }

  const result = await TeamMember.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete team member');
  }

  return result;
};

export const TeamMemberServices = {
  createTeamMemberIntoDB,
  getAllTeamMemberFromDB,
  getTeamMemberByIdFromDB,
  updateTeamMemberIntoDB,
  deleteTeamMemberFromDB,
};
