import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { AuthTokenPayload } from '../../modules/auth/auth.types';
import { tokenBlacklist } from '../services/token-blacklist';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);

  if (tokenBlacklist.has(token)) {
    return next(new AppError('Token has been invalidated', 401, 'TOKEN_INVALIDATED'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET || 'dev_secret') as AuthTokenPayload &
      jwt.JwtPayload;
    req.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      sector: payload.sector,
    };

    // Sliding window (RNF-002): renew token when less than 5 min remains
    if (payload.exp && payload.exp * 1000 - Date.now() < REFRESH_THRESHOLD_MS) {
      const newPayload: AuthTokenPayload = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        sector: payload.sector,
      };
      const newToken = jwt.sign(newPayload, env.JWT_SECRET || 'dev_secret', {
        expiresIn: env.JWT_EXPIRES_IN,
      } as jwt.SignOptions);
      res.setHeader('X-Refresh-Token', newToken);
    }

    next();
  } catch {
    next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
}
