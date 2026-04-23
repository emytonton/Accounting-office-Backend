import { Router } from 'express';
import { findAll } from './demand-types.controller';

export const demandTypesRoutes = Router();

demandTypesRoutes.get('/', findAll);
