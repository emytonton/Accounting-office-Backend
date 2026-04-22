import { Router } from 'express';
import {
  login,
  logout,
  forgotPassword,
  validateResetToken,
  resetPassword,
} from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/logout', authenticate, logout);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoutes.get('/reset-password/validate/:token', validateResetToken);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPassword);
