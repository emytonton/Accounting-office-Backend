import { Router } from 'express';
import { login, logout } from './auth.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { loginSchema } from './auth.schema';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/logout', authenticate, logout);
