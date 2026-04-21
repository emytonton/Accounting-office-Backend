import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { usersRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';

const service = new AuthService(usersRepository);

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.login(req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // TODO: implement token blacklist / session invalidation
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
