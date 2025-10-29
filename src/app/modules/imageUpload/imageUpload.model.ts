import { model, Schema } from 'mongoose';
import { TImageUpload } from './imageUpload.interface';

const imageUploadSchema = new Schema<TImageUpload>(
  {
    url: { type: String, required: true },
    key: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const ImageUpload = model<TImageUpload>(
  'ImageUpload',
  imageUploadSchema,
);
