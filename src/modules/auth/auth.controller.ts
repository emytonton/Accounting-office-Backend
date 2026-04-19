import { Request, Response, NextFunction } from 'express';

export async function login(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, message: 'module ready' });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, message: 'module ready' });
  } catch (err) {
    next(err);
  }
}
