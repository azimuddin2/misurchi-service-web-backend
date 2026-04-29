import { Router } from 'express';

import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import parseData from '../../middlewares/parseData';
import validateRequest from '../../middlewares/validateRequest';
import { MessagesController } from './message.controller';
import { MessagesValidation } from './message.validation';

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
  validateRequest(MessagesValidation.sendMessageValidation),
  MessagesController.createMessages,
);

router.patch(
  '/seen/:chatId',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),

  MessagesController.seenMessage,
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
  validateRequest(MessagesValidation.updateMessageValidation),
  MessagesController.updateMessages,
);

router.get('/my-messages/:chatId', MessagesController.getMessagesByChatId);

router.delete(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesController.deleteMessages,
);

router.get(
  '/:id',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesController.getMessagesById,
);

router.get(
  '/',
  auth(
    USER_ROLE.admin,
    USER_ROLE.user,
    USER_ROLE.vendor,
    USER_ROLE.team_member,
  ),
  MessagesController.getAllMessages,
);

export const messagesRoutes = router;
