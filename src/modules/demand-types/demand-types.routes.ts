import { Router } from 'express';
import {
  findAll,
  findById,
  createDemandType,
  updateDemandType,
  addSubtaskTemplate,
  removeSubtaskTemplate,
} from './demand-types.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createDemandTypeSchema,
  updateDemandTypeSchema,
  listDemandTypesSchema,
  addSubtaskTemplateSchema,
  subtaskTemplateIdParamSchema,
} from './demand-types.schema';

export const demandTypesRoutes = Router();

demandTypesRoutes.get('/', authenticate, validate(listDemandTypesSchema), findAll);
demandTypesRoutes.get('/:id', authenticate, findById);
demandTypesRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createDemandTypeSchema),
  createDemandType,
);
demandTypesRoutes.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateDemandTypeSchema),
  updateDemandType,
);
demandTypesRoutes.post(
  '/:id/subtask-templates',
  authenticate,
  authorize('admin'),
  validate(addSubtaskTemplateSchema),
  addSubtaskTemplate,
);
demandTypesRoutes.delete(
  '/:id/subtask-templates/:templateId',
  authenticate,
  authorize('admin'),
  validate(subtaskTemplateIdParamSchema),
  removeSubtaskTemplate,
);
