import express from 'express';
import multer, { memoryStorage } from 'multer';
import auth from '../../middlewares/auth';
import { ImageUploadController } from './imageUpload.controller';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('vendor', 'user', 'admin'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  ImageUploadController.createImageUpload,
);

export const ImageUploadRoutes = router;
