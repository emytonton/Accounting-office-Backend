import { Router } from 'express';
import { findAll } from './payments.controller';

export const paymentsRoutes = Router();

paymentsRoutes.get('/', findAll);
