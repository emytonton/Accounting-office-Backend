import { Router } from 'express';
import { findAll, createUser } from './users.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createUserSchema } from './users.schema';

export const usersRoutes = Router();

usersRoutes.get('/', findAll);
usersRoutes.post('/', validate(createUserSchema), createUser);
