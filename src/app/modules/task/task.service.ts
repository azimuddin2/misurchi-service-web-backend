import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { taskSearchableFields } from './task.constant';
import { TTask } from './task.interface';
import { Task } from './task.model';
import { TeamMember } from '../teamMember/teamMember.model';

const createTaskIntoDB = async (payload: TTask) => {
  const result = await Task.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create task');
  }
  return result;
};

const getAllTasksFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid vendor ID');
  }

  // Base query -> always exclude deleted tasks
  let taskQuery = Task.find({ vendor, isDeleted: false })
    .populate('vendor')
    .populate({
      path: 'assignTeamMember',
      select: 'firstName lastName email role image',
    });

  const queryBuilder = new QueryBuilder(taskQuery, filters)
    .search(taskSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getTasksByTeamMemberIdFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, 'Invalid user ID');
  }

  const teamMember = await TeamMember.findOne({
    user: userId,
    isDeleted: false,
  });

  if (!teamMember) {
    throw new AppError(404, 'Team member not found for this user');
  }

  const taskQuery = Task.find({
    assignTeamMember: teamMember._id,
    isDeleted: false,
  });

  const queryBuilder = new QueryBuilder(taskQuery, query)
    .search(taskSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;
  // .populate('vendor')
  // .populate('assignTeamMember');

  console.log(result);

  return { meta, result };
};

const getTaskByIdFromDB = async (id: string) => {
  const result = await Task.findById(id).populate('vendor').populate({
    path: 'assignTeamMember',
    select: 'firstName lastName email role image',
  });

  if (!result) {
    throw new AppError(404, 'This Task not found');
  }

  if (result.isDeleted === true) {
    throw new AppError(400, 'This task has been deleted');
  }

  return result;
};

const updateTaskIntoDB = async (id: string, payload: Partial<TTask>) => {
  const isTaskExists = await Task.findById(id);

  if (!isTaskExists) {
    throw new AppError(404, 'This task not exists');
  }

  if (isTaskExists.isDeleted === true) {
    throw new AppError(400, 'This task has been deleted');
  }

  const updatedTask = await Task.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedTask) {
    throw new AppError(400, 'Task update failed');
  }

  return updatedTask;
};

const updateTaskStatusIntoDB = async (
  id: string,
  payload: { status: string; note?: string },
) => {
  const isTaskExists = await Task.findById(id);

  if (!isTaskExists) {
    throw new AppError(404, 'This task is not found');
  }

  const updateData: any = {
    status: payload.status,
  };

  if (payload.note?.trim()) {
    updateData.$push = {
      notes: {
        text: payload.note.trim(),
        status: payload.status,
        createdAt: new Date(),
      },
    };
  }

  const result = await Task.findByIdAndUpdate(id, updateData, { new: true });
  return result;
};

const deleteTaskFromDB = async (id: string) => {
  const isTaskExists = await Task.findById(id);

  if (!isTaskExists) {
    throw new AppError(404, 'Task not found');
  }

  const result = await Task.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(400, 'Failed to delete task');
  }

  return result;
};

export const TaskServices = {
  createTaskIntoDB,
  getAllTasksFromDB,
  getTaskByIdFromDB,
  getTasksByTeamMemberIdFromDB,
  updateTaskIntoDB,
  updateTaskStatusIntoDB,
  deleteTaskFromDB,
};
