import express from 'express';
import multer, { memoryStorage } from 'multer';
import auth from '../../middlewares/auth';
import { ImageUploadControllers } from './imageUpload.controller';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('vendor', 'user', 'admin', 'team_member'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  ImageUploadControllers.createImageUpload,
);

export const ImageUploadRoutes = router;
