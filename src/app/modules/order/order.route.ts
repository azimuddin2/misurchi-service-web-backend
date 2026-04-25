import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderValidation } from './order.validation';
import { OrderControllers } from './order.controller';
import multer, { memoryStorage } from 'multer';
import parseData from '../../middlewares/parseData';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('user'),
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderControllers.createOrder,
);

router.get(
  '/',
  auth('vendor', 'team_member'),
  OrderControllers.getAllOrderByUser,
);

router.get('/user', auth('user'), OrderControllers.getOrdersByEmail);

router.get('/:id', auth('user'), OrderControllers.getOrderById);

router.patch(
  '/:id',
  auth('user'),
  upload.fields([{ name: 'images', maxCount: 10 }]),
  parseData(),
  validateRequest(OrderValidation.updateOrderRequestSchema),
  OrderControllers.requestOrder,
);

router.put(
  '/update-status/:id',
  auth('vendor'),
  validateRequest(OrderValidation.updateOrderStatusValidationSchema),
  OrderControllers.updateOrderStatus,
);

router.put(
  '/update-request/:id',
  auth('vendor'),
  OrderControllers.orderApprovedRequest,
);

export const OrderRoutes = router;
