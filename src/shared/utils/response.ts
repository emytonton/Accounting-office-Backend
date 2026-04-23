import { Response } from 'express';

export function successResponse<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({ success: true, data });
}

export function errorResponse(res: Response, message: string, statusCode = 400): Response {
  return res.status(statusCode).json({ success: false, error: { message } });
}
