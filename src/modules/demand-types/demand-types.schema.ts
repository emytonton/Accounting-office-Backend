import { z } from 'zod';

const subtaskTemplateSchema = z.object({
  name: z.string().min(1).max(150),
  isRequired: z.boolean().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const createDemandTypeSchema = z.object({
  body: z.object({
    sector: z.string().min(1).max(50),
    name: z.string().min(2).max(150),
    hasSubtasks: z.boolean().optional(),
    subtaskTemplates: z.array(subtaskTemplateSchema).optional(),
  }),
});

export const updateDemandTypeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      sector: z.string().min(1).max(50).optional(),
      name: z.string().min(2).max(150).optional(),
      hasSubtasks: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const listDemandTypesSchema = z.object({
  query: z.object({
    sector: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});

export const addSubtaskTemplateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: subtaskTemplateSchema,
});

export const subtaskTemplateIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    templateId: z.string().uuid(),
  }),
});
