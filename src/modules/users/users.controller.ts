import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { usersRepository } from '../../shared/repositories';
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
    const { tenantId, includeInactive } = req.query as {
      tenantId: string;
      includeInactive?: string;
    };
    const users = await service.findAll(tenantId, includeInactive === 'true');
    successResponse(res, users);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await service.create(req.body);
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
