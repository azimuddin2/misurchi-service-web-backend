import AppError from '../../errors/AppError';
import { UploadedFiles } from '../../interface/common.interface';
import { uploadManyToS3 } from '../../utils/awsS3FileUploader';
import { ImageUpload } from './imageUpload.model';

const createImageUploadIntoDB = async (files: UploadedFiles) => {
  if (!files?.images?.length) {
    throw new AppError(400, 'At least one image file is required');
  }

  try {
    // ✅ Match product logic — consistent folder
    const uploadConfigs = files.images.map((image) => ({
      file: image,
      path: 'message/images', // use the same type of subfolder you used for products
    }));

    // ✅ Upload all files
    const uploadedResults = await uploadManyToS3(uploadConfigs);
    /**
     * Expect each to return:
     * {
     *   url: "https://crystalcleaner.s3.eu-west-1.amazonaws.com/images/user/cover/1730202846572-image.jpg",
     *   key: "images/user/cover/1730202846572-image.jpg"
     * }
     */

    if (!uploadedResults?.length) {
      throw new AppError(500, 'Image upload failed');
    }

    // ✅ Store image metadata in DB
    const savedImages = await ImageUpload.insertMany(uploadedResults);

    if (!savedImages?.length) {
      throw new AppError(500, 'Failed to store image metadata');
    }

    return savedImages;
  } catch (error: any) {
    console.error('Image Upload Error:', error);
    throw new AppError(500, error.message || 'Error uploading images');
  }
};

export const ImageUploadService = {
  createImageUploadIntoDB,
};
