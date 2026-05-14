import { Request, Response, NextFunction } from 'express';
import { DemandsService } from './demands.service';
import {
  demandsRepository,
  companiesRepository,
  demandTypesRepository,
  linksRepository,
  auditRepository,
} from '../../shared/repositories';
import { AuditService } from '../audit/audit.service';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new DemandsService(
  demandsRepository,
  companiesRepository,
  demandTypesRepository,
  linksRepository,
);
const audit = new AuditService(auditRepository);

function requireUser(req: Request) {
  if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return req.user;
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const q = req.query as Record<string, string | undefined>;
    const result = await service.findAll(
      {
        tenantId: user.tenantId,
        companyId: q.companyId,
        demandTypeId: q.demandTypeId,
        status: q.status as never,
        competenceMonth: q.competenceMonth ? Number(q.competenceMonth) : undefined,
        competenceYear: q.competenceYear ? Number(q.competenceYear) : undefined,
      },
      user,
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const demand = await service.findById(user.tenantId, req.params.id);
    successResponse(res, demand);
  } catch (err) {
    next(err);
  }
}

export async function openCompetence(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const { competenceMonth, competenceYear, dueDate, companyIds } = req.body;

    const result = await service.openCompetence({
      tenantId: user.tenantId,
      competenceMonth,
      competenceYear,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      companyIds,
    });

    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'competence.opened',
      entity: 'demand',
      entityId: `${competenceYear}-${String(competenceMonth).padStart(2, '0')}`,
      metadata: {
        created: result.created,
        skipped: result.skipped,
        companyIds: companyIds ?? null,
      },
    });

    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const previous = await service.findById(user.tenantId, req.params.id);
    const updated = await service.updateStatus(
      user.tenantId,
      req.params.id,
      req.body.status,
      user,
    );

    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'demand.status_changed',
      entity: 'demand',
      entityId: updated.id,
      metadata: { from: previous.status, to: updated.status },
    });

    successResponse(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function setSubtaskCompletion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await service.setSubtaskCompletion(
      user.tenantId,
      req.params.subtaskId,
      req.body.completed === true,
      user,
    );

    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: req.body.completed ? 'subtask.completed' : 'subtask.reopened',
      entity: 'subtask',
      entityId: result.id,
      metadata: { demandId: result.demandId },
    });

    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}
