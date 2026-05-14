import { Router } from 'express';
import {
  findAll,
  findById,
  openCompetence,
  updateStatus,
  setSubtaskCompletion,
} from './demands.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  listDemandsSchema,
  openCompetenceSchema,
  updateStatusSchema,
  setSubtaskCompletionSchema,
} from './demands.schema';

export const demandsRoutes = Router();

demandsRoutes.get('/', authenticate, validate(listDemandsSchema), findAll);
demandsRoutes.get('/:id', authenticate, findById);

// US-D01: abrir competência (admin)
demandsRoutes.post(
  '/open-competence',
  authenticate,
  authorize('admin'),
  validate(openCompetenceSchema),
  openCompetence,
);

// US-D02: atualizar status da demanda
demandsRoutes.patch(
  '/:id/status',
  authenticate,
  validate(updateStatusSchema),
  updateStatus,
);

// US-D02: marcar/desmarcar subtarefa
demandsRoutes.patch(
  '/:id/subtasks/:subtaskId',
  authenticate,
  validate(setSubtaskCompletionSchema),
  setSubtaskCompletion,
);
