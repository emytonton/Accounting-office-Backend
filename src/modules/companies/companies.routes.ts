import { Router } from 'express';
import { findAll, createCompany, updateCompany, inactivateCompany } from './companies.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  inactivateCompanySchema,
  listCompaniesSchema,
} from './companies.schema';

export const companiesRoutes = Router();

companiesRoutes.get('/', authenticate, validate(listCompaniesSchema), findAll);
companiesRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createCompanySchema),
  createCompany,
);
companiesRoutes.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateCompanySchema),
  updateCompany,
);
companiesRoutes.patch(
  '/:id/inactivate',
  authenticate,
  authorize('admin'),
  validate(inactivateCompanySchema),
  inactivateCompany,
);
