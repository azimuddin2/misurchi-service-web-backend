import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ImageUploadService } from './imageUpload.service';

const createImageUpload = catchAsync(async (req, res) => {
  const files = req.files as any;
  const result = await ImageUploadService.createImageUploadIntoDB(files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Images uploaded successfully',
    data: result,
  });
});

export const ImageUploadController = {
  createImageUpload,
};
