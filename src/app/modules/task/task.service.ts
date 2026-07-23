import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { taskSearchableFields } from './task.constant';
import { TTask } from './task.interface';
import { Task } from './task.model';
import { TeamMember } from '../teamMember/teamMember.model';
import { NotificationServices } from '../notification/notification.service';
import { ModeType } from '../notification/notification.interface';
import { sendEmail } from '../../utils/sendEmail';
import {
  taskAssignedTemplate,
  taskBlockedTemplate,
  taskReviewTemplate,
} from './task.emailTemplate';

const createTaskIntoDB = async (payload: TTask) => {
  const result = await Task.create(payload);
  if (!result) {
    throw new AppError(400, 'Failed to create task');
  }

  const assignedMember = await TeamMember.findById(payload.assignTeamMember);

  if (assignedMember) {
    let assignorName = 'Someone';
    if (payload.assignor) {
      const assignorMember = await TeamMember.findById(payload.assignor);
      if (assignorMember) {
        assignorName = `${assignorMember.firstName} ${assignorMember.lastName}`;
      }
    }

    if (assignedMember.user) {
      NotificationServices.insertNotificationIntoDB({
        receiver: assignedMember.user,
        message: `You've been assigned a new task: "${result.title}"`,
        description: `Assigned by ${assignorName}`,
        reference: result._id,
        model_type: ModeType.Task,
      }).catch((err) => console.error('Notification error:', err));
    }

    if (assignedMember.email) {
      sendEmail(
        assignedMember.email,
        `📌 New Task Assigned — ${result.title}`,
        taskAssignedTemplate(
          result.title,
          `${assignedMember.firstName} ${assignedMember.lastName}`,
          assignorName,
          new Date().getFullYear(),
        ),
      ).catch((err) => console.error('Email error:', err));
    }
  }

  return result;
};

const getAllTasksFromDB = async (query: Record<string, unknown>) => {
  const { vendor, ...filters } = query;

  if (!vendor || !mongoose.Types.ObjectId.isValid(vendor as string)) {
    throw new AppError(400, 'Invalid vendor ID');
  }

  let taskQuery = Task.find({ vendor, isDeleted: false })
    .populate('vendor')
    .populate({
      path: 'assignor',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'assignTeamMember',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'reviewers',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'blockedInfo.resolver',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'notes.author',
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
    isDeleted: false,
    $or: [
      { assignTeamMember: teamMember._id },
      { reviewers: teamMember._id },
      { 'blockedInfo.resolver': teamMember._id },
    ],
  })
    .populate('vendor')
    .populate({
      path: 'assignor',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'assignTeamMember',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'reviewers',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'blockedInfo.resolver',
      select: 'firstName lastName email role image',
    });

  const queryBuilder = new QueryBuilder(taskQuery, query)
    .search(taskSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const result = await queryBuilder.modelQuery;

  return { meta, result };
};

const getTaskByIdFromDB = async (id: string) => {
  const result = await Task.findById(id)
    .populate('vendor')
    .populate({
      path: 'assignor',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'assignTeamMember',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'reviewers',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'blockedInfo.resolver',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'notes.author',
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
  authorId: string,
  payload: {
    status: string;
    note?: string;
    blockedInfo?: { reason: string; resolver: string };
    reviewers?: string[];
  },
) => {
  const isTaskExists = await Task.findById(id);

  if (!isTaskExists) {
    throw new AppError(404, 'This task is not found');
  }

  if (isTaskExists.isDeleted === true) {
    throw new AppError(400, 'This task has been deleted');
  }

  // Je manush status change korche, tar naam notification/email e dekhanor jonno
  const taggedByMember = await TeamMember.findById(authorId);
  const taggedByName = taggedByMember
    ? `${taggedByMember.firstName} ${taggedByMember.lastName}`
    : 'A team member';

  const updateData: any = {
    status: payload.status,
  };

  // Status "Blocked/Dependencies" -> blockedInfo set kora, taggedAt auto set
  if (payload.status === 'Blocked/Dependencies') {
    if (!payload.blockedInfo?.reason || !payload.blockedInfo?.resolver) {
      throw new AppError(
        400,
        'reason and resolver are required to block a task',
      );
    }

    const resolver = await TeamMember.findOne({
      _id: payload.blockedInfo.resolver,
      isDeleted: false,
    });

    if (!resolver) {
      throw new AppError(404, 'Resolver not found');
    }

    updateData.blockedInfo = {
      reason: payload.blockedInfo.reason,
      resolver: payload.blockedInfo.resolver,
      taggedAt: new Date(),
    };

    // Notification + Email - resolver-ke pathano
    if (resolver.user) {
      NotificationServices.insertNotificationIntoDB({
        receiver: resolver.user,
        message: `You've been tagged to resolve a blocked task: "${isTaskExists.title}"`,
        description: payload.blockedInfo.reason,
        reference: isTaskExists._id,
        model_type: ModeType.Task,
      }).catch((err) => console.error('Notification error:', err));
    }

    if (resolver.email) {
      sendEmail(
        resolver.email,
        `🚧 Task Blocked — Your help is needed`,
        taskBlockedTemplate(
          isTaskExists.title,
          `${resolver.firstName} ${resolver.lastName}`,
          taggedByName,
          payload.blockedInfo.reason,
          new Date().getFullYear(),
        ),
      ).catch((err) => console.error('Email error:', err));
    }
  }

  // Aage blocked chilo, ekhon onno status-e jacche -> resolvedAt set kora
  if (
    isTaskExists.status === 'Blocked/Dependencies' &&
    payload.status !== 'Blocked/Dependencies' &&
    isTaskExists.blockedInfo
  ) {
    updateData['blockedInfo.resolvedAt'] = new Date();
  }

  // Status "Needs Review" -> reviewers set kora
  if (payload.status === 'Needs Review') {
    if (!payload.reviewers || payload.reviewers.length === 0) {
      throw new AppError(
        400,
        'At least one reviewer is required to move task to review',
      );
    }

    const reviewerRecords = await TeamMember.find({
      _id: { $in: payload.reviewers },
      isDeleted: false,
    });

    if (reviewerRecords.length !== payload.reviewers.length) {
      throw new AppError(400, 'One or more reviewers not found');
    }

    const invalidReviewers = reviewerRecords.filter(
      (member) => member.role !== 'manager' && member.role !== 'supervisor',
    );

    if (invalidReviewers.length > 0) {
      throw new AppError(
        400,
        'Only manager or supervisor can be assigned as reviewer',
      );
    }

    updateData.reviewers = payload.reviewers;

    // Notification + Email - protiti reviewer-ke pathano
    reviewerRecords.forEach((reviewer) => {
      if (reviewer.user) {
        NotificationServices.insertNotificationIntoDB({
          receiver: reviewer.user,
          message: `You've been tagged to review the task: "${isTaskExists.title}"`,
          description: `Tagged by ${taggedByName}`,
          reference: isTaskExists._id,
          model_type: ModeType.Task,
        }).catch((err) => console.error('Notification error:', err));
      }

      if (reviewer.email) {
        sendEmail(
          reviewer.email,
          `📝 Review Requested — ${isTaskExists.title}`,
          taskReviewTemplate(
            isTaskExists.title,
            `${reviewer.firstName} ${reviewer.lastName}`,
            taggedByName,
            new Date().getFullYear(),
          ),
        ).catch((err) => console.error('Email error:', err));
      }
    });
  }

  if (payload.note?.trim()) {
    updateData.$push = {
      notes: {
        text: payload.note.trim(),
        status: payload.status,
        author: authorId,
        createdAt: new Date(),
      },
    };
  }

  const result = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate({
      path: 'assignor',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'assignTeamMember',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'reviewers',
      select: 'firstName lastName email role image',
    })
    .populate({
      path: 'blockedInfo.resolver',
      select: 'firstName lastName email role image',
    });

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
