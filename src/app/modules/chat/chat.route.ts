import { Router } from 'express';
import { chatControllers } from './chat.controller';
import { chatValidations } from './chat.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';

const router = Router();

router.post(
  '/',
  auth(
    USER_ROLE.admin,
    USER_ROLE.vendor,
    USER_ROLE.user,
    USER_ROLE.team_member,
  ),
  validateRequest(chatValidations.createChatValidation),
  chatControllers.createChat,
);

router.patch(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.vendor,
    USER_ROLE.user,
    USER_ROLE.team_member,
  ),
  validateRequest(chatValidations.createChatValidation),
  chatControllers.updateChat,
);

router.delete(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.vendor,
    USER_ROLE.user,
    USER_ROLE.team_member,
  ),
  chatControllers.deleteChat,
);

router.get(
  '/my-chat-list',
  auth(
    USER_ROLE.admin,
    USER_ROLE.vendor,
    USER_ROLE.user,
    USER_ROLE.team_member,
  ),
  chatControllers.getMyChatList,
);

router.get(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.vendor,
    USER_ROLE.user,
    USER_ROLE.team_member,
  ),
  chatControllers.getChatById,
);

export const chatRoutes = router;
