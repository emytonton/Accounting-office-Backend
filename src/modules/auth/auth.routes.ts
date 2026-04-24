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
import {
  loginSchema,
  forgotPasswordSchema,
  validateResetTokenSchema,
  resetPasswordSchema,
} from './auth.schema';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/logout', authenticate, logout);
authRoutes.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRoutes.post('/reset-password/validate', validate(validateResetTokenSchema), validateResetToken);
authRoutes.post('/reset-password', validate(resetPasswordSchema), resetPassword);
