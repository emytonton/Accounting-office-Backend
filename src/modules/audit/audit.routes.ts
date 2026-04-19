import { Router } from 'express';
import { findAll } from './audit.controller';

export const auditRoutes = Router();

auditRoutes.get('/', findAll);
