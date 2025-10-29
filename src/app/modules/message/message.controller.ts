import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { MessagesService } from './message.service';
import sendResponse from '../../utils/sendResponse';
import { Message } from './message.model';
import AppError from '../../errors/AppError';
import { uploadToS3 } from '../../utils/awsS3FileUploader';
import { IChat } from '../chat/chat.interface';
import Chat from '../chat/chat.model';
import { chatService } from '../chat/chat.service';
import { io } from '../../../server';
import httpStatus from 'http-status';

const createMessages = catchAsync(async (req: Request, res: Response) => {
  req.body.sender = req.user.userId;
  const result = await MessagesService.createMessages(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

// Get all messages
const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesService.getAllMessages(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

// Get messages by chat ID
const getMessagesByChatId = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesService.getMessagesByChatId(req.params.chatId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

// Get message by ID
const getMessagesById = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesService.getMessagesById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message retrieved successfully',
    data: result,
  });
});

// Update message
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

  const result = await MessagesService.updateMessages(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});

//seen messages
const seenMessage = catchAsync(async (req: Request, res: Response) => {
  const chatList: IChat | null = await Chat.findById(req.params.chatId);
  if (!chatList) {
    throw new AppError(httpStatus.BAD_REQUEST, 'chat id is not valid');
  }

  const result = await MessagesService.seenMessage(
    req.user.userId,
    req.params.chatId,
  );

  const user1 = chatList.participants[0];
  const user2 = chatList.participants[1];
  // //----------------------ChatList------------------------//
  const ChatListUser1 = await chatService.getMyChatList(user1.toString());

  const ChatListUser2 = await chatService.getMyChatList(user2.toString());

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
// Delete message
const deleteMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesService.deleteMessages(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  });
});

export const MessagesController = {
  createMessages,
  getAllMessages,
  getMessagesByChatId,
  getMessagesById,
  updateMessages,
  deleteMessages,
  seenMessage,
};
