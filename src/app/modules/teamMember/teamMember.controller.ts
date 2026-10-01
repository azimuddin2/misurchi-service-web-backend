import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TeamMemberServices } from './teamMember.service';
import { Request, Response } from 'express';

const createTeamMember = catchAsync(async (req: Request, res: Response) => {
  const vendorUserId = req.user.userId;
  const result = await TeamMemberServices.createTeamMemberIntoDB(
    vendorUserId,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Team member add successfully',
    data: result,
  });
});

const getAllTeamMember = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamMemberServices.getAllTeamMemberFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team member retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getTeamMembersByVendor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TeamMemberServices.getTeamMembersByVendorFromDB(
      req.query,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Team member retrieved successfully',
      data: result,
    });
  },
);

const getTeamMemberById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberServices.getTeamMemberByIdFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team member retrieved successfully',
    data: result,
  });
});

const updateTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberServices.updateTeamMemberIntoDB(
    id,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team member has been updated successfully.',
    data: result,
  });
});

const deleteTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeamMemberServices.deleteTeamMemberFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team member deleted successfully',
    data: result,
  });
});

export const TeamMemberControllers = {
  createTeamMember,
  getAllTeamMember,
  getTeamMembersByVendor,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
};
