import { model, Schema } from 'mongoose';
import { TContactInfo } from './contactInfo.interface';

const ContactInfoSchema = new Schema<TContactInfo>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
            v,
          );
        },
        message: 'Please enter a valid email',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone Number is required'],
      trim: true,
      set: (v: string) => v.replace(/\s+/g, ''),
      validate: {
        validator: function (v: string) {
          const cleaned = v.replace(/\s+/g, '');
          return /^\+?[0-9]{10,15}$/.test(cleaned);
        },
        message: (props: any) =>
          `${props.value} is not a valid contact number!`,
      },
    },
  },
  { timestamps: true },
);

export const ContactInfo = model<TContactInfo>(
  'ContactInfo',
  ContactInfoSchema,
);
