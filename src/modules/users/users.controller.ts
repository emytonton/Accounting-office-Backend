import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { usersRepository, authService } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new UsersService(usersRepository);

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return req.user;
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tenantId } = req.query as { tenantId: string };
    const users = await service.findAll(tenantId);
    successResponse(res, users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await service.create(req.body);

    // Auto-send first-access email when admin creates a user without a password
    if (!req.body.password) {
      await authService.forgotPassword(user.identifier);
    }

    successResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = requireUser(req);
    const user = await service.update(auth.tenantId, req.params.id, req.body);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
}

export async function inactivateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = requireUser(req);
    const user = await service.inactivate(auth.tenantId, req.params.id);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
}

export async function reactivateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = requireUser(req);
    const user = await service.reactivate(auth.tenantId, req.params.id);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
}
