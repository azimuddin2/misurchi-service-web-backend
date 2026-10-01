import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { TeamMember } from '../teamMember/teamMember.model';
import { TaskServices } from './task.service';
import { Request, Response } from 'express';

const createTask = catchAsync(async (req: Request, res: Response) => {
  const loggedInTeamMember = await TeamMember.findOne({
    user: req.user.userId,
    isDeleted: false,
  });

  const payload = {
    ...req.body,
    assignor: loggedInTeamMember?._id || undefined,
  };

  const result = await TaskServices.createTaskIntoDB(payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Task add successfully',
    data: result,
  });
});

const getAllTasks = catchAsync(async (req: Request, res: Response) => {
  const result = await TaskServices.getAllTasksFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getTasksByTeamMemberId = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await TaskServices.getTasksByTeamMemberIdFromDB(
      userId,
      req.query,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Tasks fetched successfully',
      meta: result.meta,
      data: result.result,
    });
  },
);

const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TaskServices.getTaskByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TaskServices.updateTaskIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task has been updated successfully.',
    data: result,
  });
});

const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const loggedInTeamMember = await TeamMember.findOne({
    user: req.user.userId,
    isDeleted: false,
  });

  if (!loggedInTeamMember) {
    throw new AppError(404, 'Team member not found for logged in user');
  }

  const payload = {
    status: req.body.status,
    note: req.body.note,
    blockedInfo: req.body.blockedInfo,
    reviewers: req.body.reviewers,
  };

  const result = await TaskServices.updateTaskStatusIntoDB(
    id,
    loggedInTeamMember._id.toString(),
    payload,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TaskServices.deleteTaskFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task deleted successfully',
    data: result,
  });
});

export const TaskControllers = {
  createTask,
  getAllTasks,
  getTasksByTeamMemberId,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
