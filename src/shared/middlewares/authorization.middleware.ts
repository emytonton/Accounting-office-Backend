import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { UserRole } from '../types';

// Placeholder — to be replaced with real role validation
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (roles.length === 0) return next();

    const user = req.user;
    if (!user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // TODO: implement real role check once req.user is populated
    if (!roles.includes(user.role)) {
      return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    }

    next();
  };
}
