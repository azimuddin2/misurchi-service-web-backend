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
  auth('vendor', 'admin', 'user'),
  VendorControllers.getVendorProfile,
);

router.patch(
  '/profile/:email',
  auth('vendor'),
  upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
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

router.get(
  '/summary-data/:id',
  auth('vendor', 'admin'),
  VendorControllers.getVendorSummary,
);

router.get(
  '/vendor-stats/:id',
  auth('vendor'),
  VendorControllers.getVendorDashboardStats,
);

router.get(
  '/vendor-sales-overview/:id',
  auth('vendor'),
  VendorControllers.getVendorSalesOverviewChart,
);

router.get(
  '/appointments-overview/:id',
  auth('vendor'),
  VendorControllers.getAppointmentsOverviewRate,
);

router.get(
  '/vendor-data/:id',
  auth('vendor'),
  VendorControllers.getVendorDashboardData,
);

export const VendorRoutes = router;
