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
import {
  TeamMemberPermission,
  teamMemberSearchableFields,
} from './teamMember.constant';
import {
  buildEmailWithoutPassword,
  buildEmailWithPassword,
} from './teamMember.utils';

const createTeamMemberIntoDB = async (
  vendorUserId: string,
  payload: TTeamMember,
  file: any,
) => {
  const vendor = await Vendor.findOne({ userId: vendorUserId });
  if (!vendor) {
    throw new AppError(404, 'Vendor not found');
  }

  if (file) {
    const uploadedUrl = await uploadToS3({
      file,
      fileName: `images/team/${Math.floor(100000 + Math.random() * 900000)}`,
    });
    payload.image = uploadedUrl as string;
  }

  const tempPassword = generateStrongPassword();
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingUser = await User.findOne({ email: payload.email });

    // ── user / vendor / admin Reject ──
    if (existingUser) {
      if (existingUser.role === 'user') {
        throw new AppError(
          409,
          `${payload.email} is already a registered user.`,
        );
      }
      if (existingUser.role === 'vendor') {
        throw new AppError(
          409,
          `${payload.email} is already a registered vendor.`,
        );
      }
      if (existingUser.role === 'admin') {
        throw new AppError(409, `${payload.email} is already an admin.`);
      }
    }

    let userId: any;
    let shouldSendPassword = false;
    let teamMemberDocId: any;

    // ─────────────────────────────────────────
    // Case 1: সম্পূর্ণ নতুন user
    // ─────────────────────────────────────────
    if (!existingUser) {
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
            needsPasswordChange: true,
            isVerified: true,
            vendorId: vendor._id,
          },
        ],
        { session },
      );
      if (!createdUser.length) {
        throw new AppError(400, 'Failed to create user');
      }

      userId = createdUser[0]._id;
      shouldSendPassword = true;

      // New TeamMember doc
      // pre-save hook চলবে → permissions auto set
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
            // ✅ permissions দিতে হবে না — pre-save hook দেবে
          },
        ],
        { session },
      );
      if (!createdTeamMember.length) {
        throw new AppError(400, 'Failed to create team member');
      }

      teamMemberDocId = createdTeamMember[0]._id;

      // ─────────────────────────────────────────
      // Case 2: Existing team_member
      // ─────────────────────────────────────────
    } else {
      userId = existingUser._id;

      // এই user এর TeamMember doc খোঁজো
      const existingTeamMember = await TeamMember.findOne({
        user: existingUser._id,
      });

      // Same vendor এ already আছে → Reject
      if (
        existingTeamMember &&
        existingTeamMember.vendor.toString() === vendor._id.toString()
      ) {
        throw new AppError(
          409,
          `${payload.email} is already your team member.`,
        );
      }

      if (existingTeamMember) {
        // ✅ পুরনো vendor এর teamMembers[] থেকে remove করো
        await Vendor.findByIdAndUpdate(
          existingTeamMember.vendor,
          { $pull: { teamMembers: existingTeamMember._id } },
          { session },
        );

        // ✅ Same doc update — নতুন বানাবো না
        // findByIdAndUpdate এ pre-save hook চলে না
        // তাই permissions manually set করতে হবে
        await TeamMember.findByIdAndUpdate(
          existingTeamMember._id,
          {
            vendor: vendor._id,
            role: payload.role,
            permissions: TeamMemberPermission[payload.role], // ✅ manual set
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            image: payload.image,
            speciality: payload.speciality,
            timeZone: payload.timeZone,
            workHours: payload.workHours,
            isActive: true,
          },
          { session },
        );

        teamMemberDocId = existingTeamMember._id;
      } else {
        // User আছে কিন্তু TeamMember doc নেই (edge case)
        // pre-save hook চলবে → permissions auto set হবে
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

        teamMemberDocId = createdTeamMember[0]._id;
      }

      // User এর vendorId update করো
      await User.findByIdAndUpdate(
        existingUser._id,
        { vendorId: vendor._id },
        { session },
      );

      shouldSendPassword = false;
    }

    // ✅ নতুন vendor এর teamMembers[] তে add করো
    await Vendor.findByIdAndUpdate(
      vendor._id,
      { $push: { teamMembers: teamMemberDocId } },
      { session },
    );

    // ✅ Email send
    await sendEmail(
      payload.email,
      'You have been added as a team member',
      shouldSendPassword
        ? buildEmailWithPassword(payload, vendor, tempPassword)
        : buildEmailWithoutPassword(payload, vendor),
    );

    await session.commitTransaction();
    session.endSession();

    return { teamMember: await TeamMember.findById(teamMemberDocId) };
  } catch (error: any) {
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
  let teamQuery = TeamMember.find({ vendor, isDeleted: false });

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

    // ✅ Step 5: Role change হলে permissions update করো
    if (payload.role && payload.role !== existingTeamMember.role) {
      payload.permissions = TeamMemberPermission[payload.role];
    }

    // 🔄 Step 6: Update the team member in the database
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
    throw new AppError(500, error.message || 'Failed to update team member');
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
