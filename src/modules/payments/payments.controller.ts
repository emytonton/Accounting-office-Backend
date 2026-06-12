import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { paymentsRepository, receiptsRepository, auditRepository } from '../../shared/repositories';
import { successResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';

const service = new PaymentsService(paymentsRepository, receiptsRepository, auditRepository);

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const receiptId = req.query.receiptId as string | undefined;
    const payments = await service.findAll({ tenantId: req.user.tenantId, receiptId });
    successResponse(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const payment = await service.findById(req.user.tenantId, req.params.id);
    successResponse(res, payment);
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const payment = await service.create(
      {
        tenantId: req.user.tenantId,
        receiptId: req.body.receiptId,
        paymentDate: new Date(req.body.paymentDate),
        amount: req.body.amount,
        method: req.body.method,
        methodDescription: req.body.methodDescription ?? null,
      },
      req.user.id,
    );
    successResponse(res, payment, 201);
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const summary = await service.getSummary(req.user.tenantId, req.params.receiptId);
    successResponse(res, summary);
  } catch (err) {
    next(err);
  }
}
