import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
    name: z.string().min(2).max(100),
    identifier: z.string().min(3).max(100),
    password: z.string().min(8, { message: 'password must have at least 8 characters' }),
    role: z.enum(['admin', 'collaborator']),
    sector: z.string().optional(),
  }),
});
