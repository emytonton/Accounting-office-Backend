import { Request, Response, NextFunction } from 'express';

export async function findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, message: 'module ready', data: [] });
  } catch (err) {
    next(err);
  }
}
