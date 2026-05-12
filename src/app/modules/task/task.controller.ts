import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TaskServices } from './task.service';

const createTask = catchAsync(async (req, res) => {
  const result = await TaskServices.createTaskIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Task add successfully',
    data: result,
  });
});

const getAllTasks = catchAsync(async (req, res) => {
  const result = await TaskServices.getAllTasksFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getTasksByTeamMemberId = catchAsync(async (req, res) => {
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
});

const getTaskById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.getTaskByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TaskServices.updateTaskIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Task has been updated successfully.',
    data: result,
  });
});

const updateTaskStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  const payload = {
    status: req.body.status,
    note: req.body.note,
  };

  const result = await TaskServices.updateTaskStatusIntoDB(id, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status updated successfully.',
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
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
