import { Router } from 'express';
import { findAll } from './users.controller';

export const usersRoutes = Router();

usersRoutes.get('/', findAll);
