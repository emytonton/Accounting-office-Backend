import { Router } from 'express';
import { findAll } from './audit.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';

export const auditRoutes = Router();

auditRoutes.get('/', authenticate, authorize('admin'), findAll);
