import { Request, Response, NextFunction } from 'express';
import { ExportsService } from './exports.service';
import { demandsRepository, paymentsRepository } from '../../shared/repositories';
import { AppError } from '../../shared/errors/AppError';

const service = new ExportsService(demandsRepository, paymentsRepository);

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

    const type = req.query.type as string;
    const { competenceMonth, competenceYear, companyId, receiptId } = req.query as Record<string, string | undefined>;

    let csv: string;
    let filename: string;

    if (type === 'demands') {
      csv = await service.generateDemandsCsv(req.user.tenantId, {
        competenceMonth: competenceMonth ? parseInt(competenceMonth, 10) : undefined,
        competenceYear: competenceYear ? parseInt(competenceYear, 10) : undefined,
        companyId,
      });
      filename = `demands-${Date.now()}.csv`;
    } else if (type === 'payments') {
      csv = await service.generatePaymentsCsv(req.user.tenantId, { receiptId });
      filename = `payments-${Date.now()}.csv`;
    } else {
      throw new AppError('Invalid export type. Use "demands" or "payments"', 400, 'INVALID_EXPORT_TYPE');
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
