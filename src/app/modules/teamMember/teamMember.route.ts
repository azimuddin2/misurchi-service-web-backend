import express from 'express';
import multer, { memoryStorage } from 'multer';
import parseData from '../../middlewares/parseData';
import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { TeamMemberControllers } from './teamMember.controller';
import { TeamMemberValidation } from './teamMember.validation';

const router = express.Router();
const upload = multer({ storage: memoryStorage() });

router.post(
  '/',
  auth('vendor'),
  upload.single('image'),
  parseData(),
  validateRequest(TeamMemberValidation.createTeamMemberValidationSchema),
  TeamMemberControllers.createTeamMember,
);

router.get(
  '/',
  auth('vendor', 'team_member'),
  TeamMemberControllers.getAllTeamMember,
);

router.get(
  '/:id',
  auth('vendor', 'admin'),
  TeamMemberControllers.getTeamMemberById,
);

router.patch(
  '/:id',
  auth('vendor'),
  upload.single('image'),
  parseData(),
  validateRequest(TeamMemberValidation.updateTeamMemberValidationSchema),
  TeamMemberControllers.updateTeamMember,
);

router.delete(
  '/:id',
  auth('vendor', 'admin'),
  TeamMemberControllers.deleteTeamMember,
);

export const TeamMemberRoutes = router;
