import { z } from 'zod';

const cnpjPattern = /^\d{14}$/;

const cnpjField = z
  .string()
  .transform((val) => val.replace(/\D/g, ''))
  .refine((val) => cnpjPattern.test(val), { message: 'CNPJ must contain 14 digits' });

export const createCompanySchema = z.object({
  body: z.object({
    tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
    name: z.string().min(2).max(150),
    cnpj: cnpjField,
    sector: z.string().min(1).max(100).optional(),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z
    .object({
      name: z.string().min(2).max(150).optional(),
      cnpj: cnpjField.optional(),
      sector: z.string().min(1).max(100).optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const inactivateCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z
    .object({
      force: z.boolean().optional(),
    })
    .optional(),
});

export const listCompaniesSchema = z.object({
  query: z.object({
    tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
    name: z.string().optional(),
    cnpj: z.string().optional(),
    situation: z.enum(['active', 'inactive']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
