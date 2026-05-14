import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { auditRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new AuditService(auditRepository);

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const logs = await service.findAll(req.user.tenantId);
    successResponse(res, logs);
  } catch (err) {
    next(err);
  }
}
