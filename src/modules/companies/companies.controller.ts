import { Request, Response, NextFunction } from 'express';
import { CompaniesService } from './companies.service';
import { companiesRepository, demandsRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new CompaniesService(companiesRepository, demandsRepository);

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  return req.user;
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const { tenantId, name, cnpj, situation, page, limit } = req.query as Record<string, string>;

    const isActive =
      situation === 'active' ? true : situation === 'inactive' ? false : undefined;

    const result = await service.findAll(
      {
        tenantId,
        name,
        cnpj,
        isActive,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      },
      user,
    );

    successResponse(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createCompany(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const company = await service.create(req.body);
    successResponse(res, company, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const company = await service.update(user.tenantId, req.params.id, req.body);
    successResponse(res, company);
  } catch (err) {
    next(err);
  }
}

export async function inactivateCompany(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const force = Boolean(req.body?.force);
    const company = await service.inactivate(user.tenantId, req.params.id, force);
    successResponse(res, company);
  } catch (err) {
    next(err);
  }
}
