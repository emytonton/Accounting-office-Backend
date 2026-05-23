import { z } from 'zod';

export const listDemandsSchema = z.object({
  query: z.object({
    companyId: z.string().uuid().optional(),
    demandTypeId: z.string().uuid().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
    competenceMonth: z.coerce.number().int().min(1).max(12).optional(),
    competenceYear: z.coerce.number().int().min(2000).max(9999).optional(),
  }),
});

export const openCompetenceSchema = z.object({
  body: z.object({
    competenceMonth: z.number().int().min(1).max(12),
    competenceYear: z.number().int().min(2000).max(9999),
    dueDate: z.string().datetime().optional(),
    companyIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'overdue']),
  }),
});

export const setSubtaskCompletionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    subtaskId: z.string().uuid(),
  }),
  body: z.object({
    completed: z.boolean(),
  }),
});

// US-D03: definicao/remocao de prazo de uma demanda.
export const updateDueDateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    dueDate: z
      .union([z.string().datetime(), z.null()])
      .refine((v) => v === null || typeof v === 'string', {
        message: 'dueDate must be an ISO datetime string or null',
      }),
  }),
});

// US-D04: painel consolidado por competencia.
export const dashboardSchema = z.object({
  query: z.object({
    competenceMonth: z.coerce.number().int().min(1).max(12),
    competenceYear: z.coerce.number().int().min(2000).max(9999),
    sector: z.string().optional(),
    companyId: z.string().uuid().optional(),
  }),
});
