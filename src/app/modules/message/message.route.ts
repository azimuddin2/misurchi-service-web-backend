import { Router } from 'express';

import multer, { memoryStorage } from 'multer';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import parseData from '../../middlewares/parseData';
import validateRequest from '../../middlewares/validateRequest';
import fileUpload from '../../middlewares/fileUpload';
import { MessagesController } from './message.controller';
import { MessagesValidation } from './message.validation';

const upload = fileUpload('./public/uploads/messages');

const router = Router();
// const storage = memoryStorage();
// const upload = multer({ storage });

router.post(
  '/send-messages',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),
  upload.single('image'),
  parseData(),
  validateRequest(MessagesValidation.sendMessageValidation),
  MessagesController.createMessages,
);

router.patch(
  '/seen/:chatId',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),

  MessagesController.seenMessage,
);

router.patch(
  '/update/:id',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),
  upload.single('image'),
  parseData(),
  validateRequest(MessagesValidation.updateMessageValidation),
  MessagesController.updateMessages,
);

router.get('/my-messages/:chatId', MessagesController.getMessagesByChatId);

router.delete(
  '/:id',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),
  MessagesController.deleteMessages,
);

router.get(
  '/:id',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),
  MessagesController.getMessagesById,
);

router.get(
  '/',
  auth(USER_ROLE.admin, USER_ROLE.user, USER_ROLE.vendor),
  MessagesController.getAllMessages,
);

export const messagesRoutes = router;
