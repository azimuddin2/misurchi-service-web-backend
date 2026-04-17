import { model, Schema } from 'mongoose';
import { TVendor } from './vendor.interface';
import config from '../../config';
import bcrypt from 'bcrypt';
import { ChooseOffer } from './vendor.constant';

const vendorSchema = new Schema<TVendor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
    },
    timeZone: {
      type: String,
      required: [true, 'Time zone is required'],
    },
    workHours: {
      type: String,
      required: [true, 'Work hours are required'],
    },
    image: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
    },
    description: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [8, 'Password can be minimum 8 characters'],
      maxlength: [20, 'Password can not be more than 20 characters'],
    },
    confirmPassword: {
      type: String,
      required: [true, 'Password is required'],
      trim: true,
      minlength: [8, 'Password can be minimum 8 characters'],
      maxlength: [20, 'Password can not be more than 20 characters'],
    },
    chooseOffer: {
      type: String,
      enum: {
        values: ChooseOffer,
        message: '{VALUE} is not valid',
      },
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
    reviewCount: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

vendorSchema.pre('save', async function (next) {
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
vendorSchema.post('save', function (doc, next) {
  doc.password = '';
  doc.confirmPassword = '';
  next();
});

export const Vendor = model<TVendor>('Vendor', vendorSchema);
