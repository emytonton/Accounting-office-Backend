import { Router } from 'express';
import { findAll, findById, createPayment, getSummary } from './payments.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import { createPaymentSchema, listPaymentsSchema } from './payments.schema';

export const paymentsRoutes = Router();

// GET /summary/:receiptId must come before GET /:id to avoid Express matching "summary" as :id
paymentsRoutes.get('/summary/:receiptId', authenticate, getSummary);
paymentsRoutes.get('/', authenticate, validate(listPaymentsSchema), findAll);
paymentsRoutes.get('/:id', authenticate, findById);
paymentsRoutes.post('/', authenticate, authorize('admin'), validate(createPaymentSchema), createPayment);
