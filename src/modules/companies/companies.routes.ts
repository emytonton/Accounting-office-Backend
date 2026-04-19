import { Router } from 'express';
import { findAll } from './companies.controller';

export const companiesRoutes = Router();

companiesRoutes.get('/', findAll);
