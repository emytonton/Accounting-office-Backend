import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, { message: 'identifier is required' }),
    password: z.string().min(1, { message: 'password is required' }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().min(1, { message: 'email is required' }),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, { message: 'token is required' }),
    newPassword: z.string().min(8, { message: 'password must have at least 8 characters' }),
  }),
});
