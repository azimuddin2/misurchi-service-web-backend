import { Server, Socket } from 'socket.io';
import httpStatus from 'http-status';
import { Message } from '../../app/modules/message/message.model';
import callbackFn from '../../app/utils/callbackFn';

export const registerNotificationHandlers = (
  io: Server,
  socket: Socket,
  user: any,
) => {
  socket.on('message-notification', async ({}, callback) => {
    try {
      const allUnReaddMessage = await Message.countDocuments({
        receiver: user?._id,
        seen: false,
      });
      const variable = 'new-notifications::' + user?._id;
      io.emit(variable, allUnReaddMessage);
      callbackFn(callback, { success: true, message: allUnReaddMessage });
    } catch (error) {
      callbackFn(callback, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Failed to retrieve notifications',
      });
    }
  });
};
