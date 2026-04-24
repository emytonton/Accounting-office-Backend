import { Request, Response, NextFunction } from 'express';
import { authService as service } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.login(req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization!.slice(7);
    await service.logout(token);
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
      message: 'If your email is registered, you will receive a verification code shortly.',
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
    const result = await service.validateResetToken(req.body.identifier, req.body.code);
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
    await service.resetPassword(req.body.identifier, req.body.code, req.body.newPassword);
    res.json({ success: true, message: 'Password updated successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
}
