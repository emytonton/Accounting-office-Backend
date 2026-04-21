import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, { message: 'identifier is required' }),
    password: z.string().min(1, { message: 'password is required' }),
  }),
});
