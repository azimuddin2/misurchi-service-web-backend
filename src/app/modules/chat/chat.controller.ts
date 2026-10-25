import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { chatServices } from './chat.service';
import sendResponse from '../../utils/sendResponse';

const createChat = catchAsync(async (req: Request, res: Response) => {
  const chat = await chatServices.createChat(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat created successfully',
    data: chat,
  });
});

const getMyChatList = catchAsync(async (req: Request, res: Response) => {
  const result = await chatServices.getMyChatList(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat retrieved successfully',
    data: result,
  });
});

const getChatById = catchAsync(async (req: Request, res: Response) => {
  const result = await chatServices.getChatById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat retrieved successfully',
    data: result,
  });
});

const updateChat = catchAsync(async (req: Request, res: Response) => {
  const result = await chatServices.updateChatList(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat updated successfully',
    data: result,
  });
});

const deleteChat = catchAsync(async (req: Request, res: Response) => {
  const result = await chatServices.deleteChatList(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat deleted successfully',
    data: result,
  });
});

export const chatControllers = {
  createChat,
  getMyChatList,
  getChatById,
  updateChat,
  deleteChat,
};
