import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import httpStatus from 'http-status';
import AppError from '../app/errors/AppError';
import getUserDetailsFromToken from '../app/helpers/getUserDetailsFromToken';
import callbackFn from '../app/utils/callbackFn';
import { onlineUser, socketTOUserId, userTOSocketId } from './state';
import { registerMessageHandlers } from './handlers/message.handler';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerNotificationHandlers } from './handlers/notification.handler';

const initializeSocketIO = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', async (socket) => {
    try {
      //----------------------user token get from front end-------------------------//
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.token;
      //----------------------check Token and return user details-------------------------//
      const user: any = await getUserDetailsFromToken(token);
      if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
      }

      socket.join(user?._id?.toString());

      //----------------------user id set in online array-------------------------//
      onlineUser.add(user?._id?.toString());
      socketTOUserId.set(socket?.id, user?._id?.toString());
      userTOSocketId.set(user?._id?.toString(), socket?.id);

      socket.on('check', (data, callback) => {
        callbackFn(callback, { success: true });
      });

      //----------------------online array send for front end------------------------//
      io.emit('onlineUser', Array.from(onlineUser));

      registerMessageHandlers(io, socket, user);
      registerChatHandlers(io, socket, user);
      registerNotificationHandlers(io, socket, user);

      socket.on('disconnect', () => {
        onlineUser.delete(user?._id?.toString());
        socketTOUserId.delete(socket?.id);
        userTOSocketId.delete(user?._id);
        io.emit('onlineUser', Array.from(onlineUser));
        console.log('disconnect user ', socket.id);
      });
    } catch (error) {
      console.error('-- socket.io connection error --', error);
    }
  });

  return io;
};

export default initializeSocketIO;
