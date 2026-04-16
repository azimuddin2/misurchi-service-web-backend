import { model, Schema } from 'mongoose';
import { TTeamMember } from './teamMember.interface';
import { TeamMemberRole } from './teamMember.constant';

const teamMemberSchema = new Schema<TTeamMember>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      required: [true, 'Vendor Id is required'],
      ref: 'Vendor',
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
    },

    image: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: {
        values: TeamMemberRole,
        message: '{VALUE} is not valid',
      },
      default: 'team_member',
    },

    speciality: {
      type: String,
      required: true,
    },

    customPermissions: {
      type: [String],
      default: undefined,
    },

    timeZone: {
      type: String,
      required: [true, 'Time zone is required'],
    },

    workHours: {
      type: String,
      required: [true, 'Work hours is required'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const TeamMember = model<TTeamMember>('TeamMember', teamMemberSchema);
