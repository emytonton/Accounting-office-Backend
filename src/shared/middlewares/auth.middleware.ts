import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

// Placeholder — to be replaced with real JWT verification
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  // TODO: verify JWT and attach decoded payload to req.user
  next();
}
