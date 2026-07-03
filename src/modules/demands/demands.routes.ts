import { Router } from 'express';
import {
  findAll,
  findById,
  openCompetence,
  updateStatus,
  setSubtaskCompletion,
  updateDueDate,
  deleteDemand,
  dashboard,
} from './demands.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  listDemandsSchema,
  openCompetenceSchema,
  updateStatusSchema,
  setSubtaskCompletionSchema,
  updateDueDateSchema,
  dashboardSchema,
} from './demands.schema';

export const demandsRoutes = Router();

// US-D04: painel consolidado (admin) — declarado antes de /:id para nao conflitar
demandsRoutes.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  validate(dashboardSchema),
  dashboard,
);

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

// US-D03: definir/remover prazo
demandsRoutes.patch(
  '/:id/due-date',
  authenticate,
  validate(updateDueDateSchema),
  updateDueDate,
);

// US-D02: marcar/desmarcar subtarefa
demandsRoutes.patch(
  '/:id/subtasks/:subtaskId',
  authenticate,
  validate(setSubtaskCompletionSchema),
  setSubtaskCompletion,
);

// Exclusão de demanda (apenas admin)
demandsRoutes.delete('/:id', authenticate, authorize('admin'), deleteDemand);
