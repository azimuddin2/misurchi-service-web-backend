import { model, Schema } from 'mongoose';
import { TPermission, TTeamMember } from './teamMember.interface';
import { TeamMemberPermission, TeamMemberRole } from './teamMember.constant';

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

    firstName: {
      type: String,
      required: [true, 'First Name is required'],
      trim: true,
      minlength: [3, 'The length of first name can be minimum 3 characters'],
      maxlength: [20, 'The length of first name can be maximum 20 characters'],
    },

    lastName: {
      type: String,
      required: [true, 'Last Name is required'],
      trim: true,
      minlength: [3, 'The length of last name can be minimum 3 characters'],
      maxlength: [20, 'The length of last name can be maximum 20 characters'],
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
    // ✅ core change: typed permissions replace customPermissions
    // permissions: {
    //   type: [String],
    //   enum: {
    //     values: TeamMemberPermission,  // ✅ constant থেকে array
    //     message: '{VALUE} is not a valid permission',
    //   },
    //   default: [],
    // },
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

// ✅ role assign automatically permissions set
// teamMemberSchema.pre('save', function (next) {
//   if (this.isModified('role')) {
//     this.permissions = TeamMemberPermission[this.role] as TPermission[];
//   }
//   next();
// });

export const TeamMember = model<TTeamMember>('TeamMember', teamMemberSchema);
