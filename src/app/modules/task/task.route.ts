import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { TaskValidations } from './task.validation';
import { TaskControllers } from './task.controller';

const router = express.Router();

router.post(
  '/',
  auth('vendor', 'team_member'),
  validateRequest(TaskValidations.createTaskValidationSchema),
  TaskControllers.createTask,
);

router.get('/', auth('vendor', 'team_member'), TaskControllers.getAllTasks);

router.get(
  '/:id',
  auth('vendor', 'admin', 'team_member'),
  TaskControllers.getTaskById,
);

router.patch(
  '/:id',
  auth('vendor', 'team_member'),
  validateRequest(TaskValidations.updateTaskValidationSchema),
  TaskControllers.updateTask,
);

router.put(
  '/update-status/:id',
  auth('vendor', 'team_member'),
  validateRequest(TaskValidations.updateTaskStatusValidationSchema),
  TaskControllers.updateTaskStatus,
);

router.delete(
  '/:id',
  auth('vendor', 'team_member'),
  TaskControllers.deleteTask,
);

export const TaskRoutes = router;
