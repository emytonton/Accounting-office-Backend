import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { auditRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new AuditService(auditRepository);

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const { entity, action, userId, dateFrom, dateTo, page, limit } = req.query as Record<string, string | undefined>;

    const result = await service.findAll({
      tenantId: req.user.tenantId,
      entity,
      action,
      userId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}
