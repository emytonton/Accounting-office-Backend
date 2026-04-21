import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { usersRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';

const service = new UsersService(usersRepository);

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
    successResponse(res, user, 201);
  } catch (err) {
    next(err);
  }
}
