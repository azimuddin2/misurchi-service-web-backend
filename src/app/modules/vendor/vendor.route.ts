import express from 'express';
import multer, { memoryStorage } from 'multer';
import parseData from '../../middlewares/parseData';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { VendorControllers } from './vendor.controller';
import { VendorValidations } from './vendor.validation';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.get('/', VendorControllers.getAllVendors);

router.get('/:id', VendorControllers.getVendorUserById);

router.get(
  '/profile/:email',
  auth('vendor', 'admin'),
  VendorControllers.getVendorProfile,
);

router.patch(
  '/profile/:email',
  auth('vendor'),
  upload.single('profile'),
  parseData(),
  validateRequest(VendorValidations.updateVendorUserValidationSchema),
  VendorControllers.updateVendorProfile,
);

router.put(
  '/choose-offer/:id',
  auth('vendor'),
  validateRequest(VendorValidations.chooseOfferValidationSchema),
  VendorControllers.chooseOffer,
);

export const VendorRoutes = router;
