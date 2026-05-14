import { Request, Response, NextFunction } from 'express';
import { DemandTypesService } from './demand-types.service';
import { demandTypesRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new DemandTypesService(demandTypesRepository);

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return req.user;
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { sector, isActive } = req.query as { sector?: string; isActive?: string };
    const result = await service.findAll({
      tenantId: user.tenantId,
      sector,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const dt = await service.findById(user.tenantId, req.params.id);
    successResponse(res, dt);
  } catch (err) {
    next(err);
  }
}

export async function createDemandType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const dt = await service.create({ ...req.body, tenantId: user.tenantId });
    successResponse(res, dt, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDemandType(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const dt = await service.update(user.tenantId, req.params.id, req.body);
    successResponse(res, dt);
  } catch (err) {
    next(err);
  }
}

export async function addSubtaskTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const t = await service.addSubtaskTemplate(user.tenantId, req.params.id, req.body);
    successResponse(res, t, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeSubtaskTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    await service.removeSubtaskTemplate(user.tenantId, req.params.id, req.params.templateId);
    successResponse(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
