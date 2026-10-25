import { Router } from 'express';

import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import parseData from '../../middlewares/parseData';
import validateRequest from '../../middlewares/validateRequest';
import { MessagesControllers } from './message.controller';
import { MessagesValidations } from './message.validation';

const router = Router();

router.post(
  '/send-messages',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  parseData(),
  validateRequest(MessagesValidations.sendMessageValidation),
  MessagesControllers.createMessages,
);

router.patch(
  '/seen/:chatId',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),

  MessagesControllers.seenMessage,
);

router.patch(
  '/update/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  parseData(),
  validateRequest(MessagesValidations.updateMessageValidation),
  MessagesControllers.updateMessages,
);

router.get('/my-messages/:chatId', MessagesControllers.getMessagesByChatId);

router.delete(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesControllers.deleteMessages,
);

router.get(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesControllers.getMessagesById,
);

router.get(
  '/',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesControllers.getAllMessages,
);

export const messagesRoutes = router;
