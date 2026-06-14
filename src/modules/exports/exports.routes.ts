import { Router } from 'express';
import { exportCsv } from './exports.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';

export const exportsRoutes = Router();

exportsRoutes.get('/csv', authenticate, authorize('admin'), exportCsv);
