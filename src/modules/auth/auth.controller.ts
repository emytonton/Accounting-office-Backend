import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { usersRepository } from '../../shared/repositories';
import { emailService } from '../../shared/services/email.service';
import { successResponse } from '../../shared/utils/response';

const service = new AuthService(usersRepository, emailService);

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
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.forgotPassword(req.body.email);
    res.json({
      success: true,
      message: 'If your email is registered, you will receive a link shortly.',
    });
  } catch (err) {
    next(err);
  }
}

export async function validateResetToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await service.validateResetToken(req.params.token);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.resetPassword(req.body.token, req.body.newPassword);
    res.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
}
