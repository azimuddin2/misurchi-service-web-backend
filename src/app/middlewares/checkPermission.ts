import { NextFunction, Request, Response } from 'express';
import AppError from '../errors/AppError';
import { TPermission } from '../modules/teamMember/teamMember.interface';

const checkPermission = (...requiredPermissions: TPermission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role, permissions } = req.user;

    // vendor / admin → pass
    if (role === 'vendor' || role === 'admin') return next();

    // team_member → check
    if (role === 'team_member') {
      const hasAll = requiredPermissions.every((p) => permissions?.includes(p));

      if (!hasAll) {
        throw new AppError(403, 'You do not have permission!');
      }
    }

    next();
  };
};

export default checkPermission;
