import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { AuthTokenPayload } from '../../modules/auth/auth.types';
import { tokenBlacklist } from '../services/token-blacklist';
import { userSessionInvalidator } from '../services/user-session-invalidator';

// RNF-002: sessão expira após 30 min de INATIVIDADE. Para isso, renovamos o
// token sempre que ele já passou da metade da sua vida — assim qualquer
// requisição na segunda metade "desliza" a janela, e só uma inatividade real
// (sem nenhuma chamada) deixa o token expirar.

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

    if (userSessionInvalidator.isTokenInvalidated(payload.userId, payload.iat)) {
      return next(new AppError('Session has been invalidated', 401, 'SESSION_INVALIDATED'));
    }

    req.user = {
      id: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
      sector: payload.sector,
    };

    // Sliding window (RNF-002): renova quando já passou da metade da vida do token.
    const nowSec = Date.now() / 1000;
    const pastMidpoint =
      payload.exp && payload.iat && nowSec > (payload.exp + payload.iat) / 2;
    if (pastMidpoint) {
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
