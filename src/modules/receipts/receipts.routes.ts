import { Router } from 'express';
import {
  findAll,
  findById,
  createReceipt,
  cancelReceipt,
  getPdf,
} from './receipts.controller';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { authorize } from '../../shared/middlewares/authorization.middleware';
import { validate } from '../../shared/middlewares/validate.middleware';
import {
  createReceiptSchema,
  cancelReceiptSchema,
  listReceiptsSchema,
  pdfQuerySchema,
} from './receipts.schema';

export const receiptsRoutes = Router();

receiptsRoutes.get('/', authenticate, validate(listReceiptsSchema), findAll);
receiptsRoutes.get('/:id', authenticate, findById);

// US-H01: emissao de recibo (admin)
receiptsRoutes.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createReceiptSchema),
  createReceipt,
);

// US-H02: cancelamento (admin)
receiptsRoutes.patch(
  '/:id/cancel',
  authenticate,
  authorize('admin'),
  validate(cancelReceiptSchema),
  cancelReceipt,
);

// US-H01/H02: download do PDF; copy=true gera 2a via
receiptsRoutes.get(
  '/:id/pdf',
  authenticate,
  validate(pdfQuerySchema),
  getPdf,
);
