import { Router } from 'express';
import { findAll } from './tenants.controller';

export const tenantsRoutes = Router();

tenantsRoutes.get('/', findAll);
