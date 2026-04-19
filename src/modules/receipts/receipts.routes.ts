import { Router } from 'express';
import { findAll } from './receipts.controller';

export const receiptsRoutes = Router();

receiptsRoutes.get('/', findAll);
