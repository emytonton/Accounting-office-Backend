import { Request, Response, NextFunction } from 'express';
import { LinksService } from './links.service';
import {
  linksRepository,
  companiesRepository,
  demandTypesRepository,
  auditRepository,
} from '../../shared/repositories';
import { AuditService } from '../audit/audit.service';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new LinksService(linksRepository, companiesRepository, demandTypesRepository);
const audit = new AuditService(auditRepository);

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return req.user;
}

export async function catalog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await service.catalogForCompany(user.tenantId, req.params.companyId);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listLinks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await service.listByCompany(user.tenantId, req.params.companyId);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const link = await service.create({
      tenantId: user.tenantId,
      companyId: req.params.companyId,
      demandTypeId: req.body.demandTypeId,
      subtasksEnabled: req.body.subtasksEnabled,
    });
    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'company_demand_type_link.created',
      entity: 'company_demand_type_link',
      entityId: link.id,
      metadata: {
        companyId: link.companyId,
        demandTypeId: link.demandTypeId,
      },
    });
    successResponse(res, link, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const link = await service.update(user.tenantId, req.params.linkId, req.body);
    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'company_demand_type_link.updated',
      entity: 'company_demand_type_link',
      entityId: link.id,
      metadata: { changes: req.body },
    });
    successResponse(res, link);
  } catch (err) {
    next(err);
  }
}

export async function removeLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const link = await service.remove(user.tenantId, req.params.linkId);
    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'company_demand_type_link.removed',
      entity: 'company_demand_type_link',
      entityId: link.id,
      metadata: { companyId: link.companyId, demandTypeId: link.demandTypeId },
    });
    successResponse(res, link);
  } catch (err) {
    next(err);
  }
}
