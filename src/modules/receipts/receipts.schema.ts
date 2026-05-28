import { z } from 'zod';

export const createReceiptSchema = z.object({
  body: z.object({
    companyId: z.string().uuid({ message: 'companyId must be a valid UUID' }),
    competenceMonth: z.number().int().min(1).max(12),
    competenceYear: z.number().int().min(2000).max(9999),
    amount: z.number().positive({ message: 'amount must be positive' }),
  }),
});

export const cancelReceiptSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    reason: z.string().min(3).max(500),
    force: z.boolean().optional(),
  }),
});

export const listReceiptsSchema = z.object({
  query: z.object({
    companyId: z.string().uuid().optional(),
    year: z.coerce.number().int().min(2000).max(9999).optional(),
    status: z.enum(['active', 'cancelled']).optional(),
    competenceMonth: z.coerce.number().int().min(1).max(12).optional(),
    competenceYear: z.coerce.number().int().min(2000).max(9999).optional(),
  }),
});

export const pdfQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    copy: z.enum(['true', 'false']).optional(),
  }),
});
