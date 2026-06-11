import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    receiptId: z.string().uuid(),
    paymentDate: z.string().datetime(),
    amount: z.number().positive(),
    method: z.enum(['cash', 'bank_transfer', 'pix', 'credit_card', 'other']),
    methodDescription: z.string().min(1).optional(),
  }).refine(
    (data) => data.method !== 'other' || !!data.methodDescription,
    { message: 'methodDescription is required when method is "other"', path: ['methodDescription'] },
  ),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    receiptId: z.string().uuid().optional(),
  }),
});
