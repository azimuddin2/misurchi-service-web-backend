import { Server, Socket } from 'socket.io';
import { chatServices } from '../../app/modules/chat/chat.service';
import callbackFn from '../../app/utils/callbackFn';
import { getSocketId } from '../state';

export const registerChatHandlers = (io: Server, socket: Socket, user: any) => {
  socket.on('my-chat-list', async (data, callback) => {
    try {
      const chatList = await chatServices.getMyChatList(user?._id);
      const mySocketId = getSocketId(user?._id);

      io.to(mySocketId).emit('chat-list', chatList);

      callbackFn(callback, { success: true, message: chatList });
    } catch (error: any) {
      callbackFn(callback, {
        success: false,
        message: error.message,
      });
      io.emit('io-error', { success: false, message: error.message });
    }
  });
};
