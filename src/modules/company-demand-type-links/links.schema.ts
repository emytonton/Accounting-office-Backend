import { z } from 'zod';

export const companyIdParamSchema = z.object({
  params: z.object({ companyId: z.string().uuid() }),
});

export const createLinkSchema = z.object({
  params: z.object({ companyId: z.string().uuid() }),
  body: z.object({
    demandTypeId: z.string().uuid(),
    subtasksEnabled: z.boolean().optional(),
  }),
});

export const updateLinkSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
    linkId: z.string().uuid(),
  }),
  body: z
    .object({
      subtasksEnabled: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const linkIdParamSchema = z.object({
  params: z.object({
    companyId: z.string().uuid(),
    linkId: z.string().uuid(),
  }),
});
