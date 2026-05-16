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
  auth('vendor', 'admin', 'user', 'team_member'),
  VendorControllers.getVendorProfile,
);

router.patch(
  '/profile/:email',
  auth('vendor', 'team_member'),
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
  auth('vendor', 'team_member'),
  VendorControllers.getVendorDashboardStats,
);

router.get(
  '/vendor-sales-overview/:id',
  auth('vendor', 'team_member'),
  VendorControllers.getVendorSalesOverviewChart,
);

router.get(
  '/appointments-overview/:id',
  auth('vendor', 'team_member'),
  VendorControllers.getAppointmentsOverviewRate,
);

router.get(
  '/vendor-data/:id',
  auth('vendor', 'team_member'),
  VendorControllers.getVendorDashboardData,
);

router.get('/profile-stats/:id', VendorControllers.getVendorProfileStats);

export const VendorRoutes = router;
