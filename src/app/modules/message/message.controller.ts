import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { MessagesServices } from './message.service';
import sendResponse from '../../utils/sendResponse';
import { Message } from './message.model';
import AppError from '../../errors/AppError';
import { uploadToS3 } from '../../utils/awsS3FileUploader';
import { IChat } from '../chat/chat.interface';
import Chat from '../chat/chat.model';
import { chatServices } from '../chat/chat.service';
import { io } from '../../../server';
import httpStatus from 'http-status';

const createMessages = catchAsync(async (req: Request, res: Response) => {
  req.body.sender = req.user.userId;
  const result = await MessagesServices.createMessages(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.getAllMessages(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const getMessagesByChatId = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.getMessagesByChatId(req.params.chatId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const getMessagesById = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.getMessagesById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message retrieved successfully',
    data: result,
  });
});

const updateMessages = catchAsync(async (req: Request, res: Response) => {
  if (req.file) {
    const message = await Message.findById(req.params.id);
    if (!message) {
      throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
    }
    const imageUrl = await uploadToS3({
      file: req.file,
      fileName: `images/messages/${message.chat}/${message.id}`,
    });

    req.body.imageUrl = imageUrl;
  }

  const result = await MessagesServices.updateMessages(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});

const seenMessage = catchAsync(async (req: Request, res: Response) => {
  const chatList: IChat | null = await Chat.findById(req.params.chatId);
  if (!chatList) {
    throw new AppError(httpStatus.BAD_REQUEST, 'chat id is not valid');
  }

  const result = await MessagesServices.seenMessage(
    req.user.userId,
    req.params.chatId,
  );

  const user1 = chatList.participants[0];
  const user2 = chatList.participants[1];
  // //----------------------ChatList------------------------//
  const ChatListUser1 = await chatServices.getMyChatList(user1.toString());

  const ChatListUser2 = await chatServices.getMyChatList(user2.toString());

  const user1Chat = 'chat-list::' + user1;

  const user2Chat = 'chat-list::' + user2;

  io.emit(user1Chat, ChatListUser1);
  io.emit(user2Chat, ChatListUser2);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message seen successfully',
    data: result,
  });
});

const deleteMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.deleteMessages(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  });
});

export const MessagesControllers = {
  createMessages,
  getAllMessages,
  getMessagesByChatId,
  getMessagesById,
  updateMessages,
  deleteMessages,
  seenMessage,
};
