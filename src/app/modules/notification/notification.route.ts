import { Router } from 'express';
import { notificationControllers } from './notification.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';

const router = Router();

// router.post("/",)

router.get(
  '/',
  auth(
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.admin,
    USER_ROLE.team_member,
  ),
  notificationControllers.getAllNotifications,
);

router.get(
  '/:id',
  auth(
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.admin,
    USER_ROLE.team_member,
  ),
  notificationControllers.getNotificationById,
);

router.patch(
  '/',
  auth(
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.admin,
    USER_ROLE.team_member,
  ),
  notificationControllers.markAsDone,
);

router.delete(
  '/',
  auth(
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.admin,
    USER_ROLE.team_member,
  ),
  notificationControllers.deleteNotification,
);

export const NotificationRoutes = router;
