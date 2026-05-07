import { Router } from 'express';
import {
  findAll,
  createUser,
  updateUser,
  inactivateUser,
  reactivateUser,
} from './users.controller';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './users.schema';

export const usersRoutes = Router();

usersRoutes.get('/', findAll);
usersRoutes.post('/', validate(createUserSchema), createUser);

// RN-002: only admins can manage users.
usersRoutes.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateUserSchema),
  updateUser,
);
usersRoutes.patch(
  '/:id/inactivate',
  authenticate,
  authorize('admin'),
  validate(userIdParamSchema),
  inactivateUser,
);
usersRoutes.patch(
  '/:id/reactivate',
  authenticate,
  authorize('admin'),
  validate(userIdParamSchema),
  reactivateUser,
);
