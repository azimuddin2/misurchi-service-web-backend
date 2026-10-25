import { NextFunction, Request, Response } from 'express';
import { uploadManyToS3 } from '../utils/awsS3FileUploader';

const multyUploader = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = req.files as Express.Multer.File[];

    const rawData = req.body?.data;

    const parsedData = rawData ? JSON.parse(rawData) : rawData;

    // 🖼 Upload all images to S3
    const uploadedUrls: string[] = [];
    const imagePaths: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const ext = file.originalname.split('.').pop();
        const path = `onenet/products/${Math.floor(100000 + Math.random() * 900000)}.${ext}`;
        imagePaths.push(path);

        const upload = await uploadManyToS3([{ file, path }]);
        console.log(upload);
        return;
      }
    }

    console.log({ ...parsedData, uploadedUrls, imagePaths });

    next();
  } catch (error) {
    next(error);
  }
};

export default multyUploader;
