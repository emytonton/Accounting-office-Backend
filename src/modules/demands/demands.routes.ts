import { Router } from 'express';
import { findAll } from './demands.controller';

export const demandsRoutes = Router();

demandsRoutes.get('/', findAll);
