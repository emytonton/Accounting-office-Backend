import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
    name: z.string().min(2).max(100),
    identifier: z.string().min(3).max(100),
    password: z
      .string()
      .min(8, { message: 'password must have at least 8 characters' })
      .optional(),
    role: z.enum(['admin', 'collaborator']),
    sector: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      identifier: z.string().min(3).max(100).optional(),
      role: z.enum(['admin', 'collaborator']).optional(),
      sector: z.string().optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
});
