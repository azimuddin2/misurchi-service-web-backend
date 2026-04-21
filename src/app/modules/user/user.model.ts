import { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { TUser, UserModel } from './user.interface';
import config from '../../config';
import { Subscribed, UserRole, UserStatus } from './user.constant';

const userSchema = new Schema<TUser, UserModel>(
  {
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
    fullName: {
      type: String,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone Number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{10,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid contact number!`,
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [8, 'Password can be minimum 8 characters'],
      // maxlength: [20, 'Password can not be more than 20 characters'],
    },
    confirmPassword: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [8, 'Password can be minimum 8 characters'],
      // maxlength: [20, 'Password can not be more than 20 characters'],
    },
    needsPasswordChange: {
      type: Boolean,
      default: false,
    },
    passwordChangeAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: {
        values: UserRole,
        message: '{VALUE} is not valid',
      },
      default: 'user',
    },
    image: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: UserStatus,
        message: '{VALUE} is not valid',
      },
      default: 'ongoing',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verification: {
      otp: {
        type: String,
        select: 0,
      },
      expiresAt: {
        type: Date,
        select: 0,
      },
      status: {
        type: Boolean,
        default: false,
        select: 0,
      },
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    subscribed: {
      type: String,
      enum: {
        values: Subscribed,
        message: '{VALUE} is not valid',
      },
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      streetAddress: {
        type: String,
      },
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeAccountId: {
      type: String,
      default: null,
    },
    stripeOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
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

// ✅ Virtual field: fullName
userSchema.pre('save', function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

userSchema.pre('save', async function (next) {
  const user = this;

  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds),
  );

  user.confirmPassword = await bcrypt.hash(
    user.confirmPassword,
    Number(config.bcrypt_salt_rounds),
  );

  next();
});

// set '' after saving password
userSchema.post('save', function (doc, next) {
  doc.password = '';
  doc.confirmPassword = '';
  next();
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return await User.findOne({ email }).select('+password');
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = async function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number,
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 100;

  return passwordChangedTime > jwtIssuedTimestamp;
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = async function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number,
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 100;

  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>('User', userSchema);
