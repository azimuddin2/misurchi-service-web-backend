import express from 'express';
import multer, { memoryStorage } from 'multer';
import { ProductControllers } from './product.controller';
import parseData from '../../middlewares/parseData';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ProductValidations } from './product.validation';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('vendor'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  parseData(),
  validateRequest(ProductValidations.createProductValidationSchema),
  ProductControllers.createProduct,
);

router.get('/', ProductControllers.getAllProduct);
router.get('/vendor', ProductControllers.getAllProductByVendor);
router.get('/:id', ProductControllers.getProductById);

router.patch(
  '/:id',
  auth('vendor'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  parseData(),
  validateRequest(ProductValidations.updateProductValidationSchema),
  ProductControllers.updateProduct,
);

router.put(
  '/update-status/:id',
  auth('admin', 'vendor'),
  validateRequest(ProductValidations.updateProductStatusValidationSchema),
  ProductControllers.updateProductStatus,
);

router.put(
  '/highlight-status/:id',
  auth('admin', 'vendor'),
  validateRequest(
    ProductValidations.updateProductHighlightStatusValidationSchema,
  ),
  ProductControllers.updateProductHighlightStatus,
);

router.delete(
  '/:id',
  auth('vendor', 'admin'),
  ProductControllers.deleteProduct,
);

export const ProductRoutes = router;
