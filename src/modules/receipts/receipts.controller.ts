import { Request, Response, NextFunction } from 'express';
import { ReceiptsService } from './receipts.service';
import {
  receiptsRepository,
  companiesRepository,
  paymentsRepository,
  auditRepository,
} from '../../shared/repositories';
import { AuditService } from '../audit/audit.service';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new ReceiptsService(
  receiptsRepository,
  companiesRepository,
  paymentsRepository,
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
    const receipts = await service.findAll({
      tenantId: user.tenantId,
      companyId: q.companyId,
      year: q.year ? Number(q.year) : undefined,
      status: q.status as 'active' | 'cancelled' | undefined,
      competenceMonth: q.competenceMonth ? Number(q.competenceMonth) : undefined,
      competenceYear: q.competenceYear ? Number(q.competenceYear) : undefined,
    });
    successResponse(res, receipts);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const receipt = await service.findById(user.tenantId, req.params.id);
    successResponse(res, receipt);
  } catch (err) {
    next(err);
  }
}

export async function createReceipt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const receipt = await service.create({
      tenantId: user.tenantId,
      companyId: req.body.companyId,
      competenceMonth: req.body.competenceMonth,
      competenceYear: req.body.competenceYear,
      amount: req.body.amount,
    });
    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'receipt.issued',
      entity: 'receipt',
      entityId: receipt.id,
      metadata: { number: receipt.number, year: receipt.year, amount: receipt.amount },
    });
    successResponse(res, receipt, 201);
  } catch (err) {
    next(err);
  }
}

export async function cancelReceipt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = requireUser(req);
    const result = await service.cancel(user.tenantId, req.params.id, {
      reason: req.body.reason,
      force: req.body.force === true,
    });
    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: result.forced ? 'receipt.cancelled_forced' : 'receipt.cancelled',
      entity: 'receipt',
      entityId: result.receipt.id,
      metadata: { reason: req.body.reason },
    });
    successResponse(res, result.receipt);
  } catch (err) {
    next(err);
  }
}

export async function getPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = requireUser(req);
    const isSecondCopy = req.query.copy === 'true';
    const { pdf, filename, receipt } = await service.getPdf(
      user.tenantId,
      req.params.id,
      isSecondCopy,
    );

    await audit.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: isSecondCopy ? 'receipt.second_copy_issued' : 'receipt.pdf_issued',
      entity: 'receipt',
      entityId: receipt.id,
      metadata: { number: receipt.number, year: receipt.year },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
