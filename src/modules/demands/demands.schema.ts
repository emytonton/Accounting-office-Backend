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
