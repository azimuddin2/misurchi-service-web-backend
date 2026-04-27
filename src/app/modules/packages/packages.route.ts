import express from 'express';
import multer, { memoryStorage } from 'multer';
import parseData from '../../middlewares/parseData';
import auth from '../../middlewares/auth';
import { PackagesControllers } from './packages.controller';
import validateRequest from '../../middlewares/validateRequest';
import { PackagesValidations } from './packages.validation';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('vendor', 'team_member'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  parseData(),
  validateRequest(PackagesValidations.createPackagesValidationSchema),
  PackagesControllers.createPackages,
);

router.get('/availability', PackagesControllers.getAvailability);

router.get('/', PackagesControllers.getAllPackages);
router.get('/vendor', PackagesControllers.getAllPackagesByVendor);
router.get('/:id', PackagesControllers.getPackagesById);

router.patch(
  '/:id',
  auth('vendor', 'team_member'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  parseData(),
  validateRequest(PackagesValidations.updatePackagesValidationSchema),
  PackagesControllers.updatePackages,
);

router.delete(
  '/:id',
  auth('vendor', 'admin', 'team_member'),
  PackagesControllers.deletePackages,
);

router.put(
  '/update-status/:id',
  auth('admin', 'vendor', 'team_member'),
  validateRequest(PackagesValidations.updatePackagesStatusValidationSchema),
  PackagesControllers.updatePackagesStatus,
);

router.put(
  '/highlight-status/:id',
  auth('admin', 'vendor', 'team_member'),
  validateRequest(
    PackagesValidations.updatePackagesHighlightStatusValidationSchema,
  ),
  PackagesControllers.updatePackagesHighlightStatus,
);

export const PackagesRoutes = router;
