import { IDemandsRepository } from '../demands/demands.repository';
import { IPaymentsRepository } from '../payments/payments.repository';

function csvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
    .join(',');
}

export class ExportsService {
  constructor(
    private readonly demandsRepository: IDemandsRepository,
    private readonly paymentsRepository: IPaymentsRepository,
  ) {}

  async generateDemandsCsv(
    tenantId: string,
    filters: { competenceMonth?: number; competenceYear?: number; companyId?: string },
  ): Promise<string> {
    const demands = await this.demandsRepository.findAll({
      tenantId,
      ...filters,
    });

    const header = csvRow([
      'id', 'companyId', 'demandTypeId', 'competenceMonth', 'competenceYear',
      'status', 'dueDate', 'completedAt', 'isOverdue', 'createdAt',
    ]);

    const rows = demands.map((d) =>
      csvRow([
        d.id, d.companyId, d.demandTypeId, d.competenceMonth, d.competenceYear,
        d.status,
        d.dueDate ? d.dueDate.toISOString() : null,
        d.completedAt ? d.completedAt.toISOString() : null,
        d.isOverdue ?? false,
        d.createdAt ? d.createdAt.toISOString() : null,
      ]),
    );

    return [header, ...rows].join('\n');
  }

  async generatePaymentsCsv(
    tenantId: string,
    filters: { receiptId?: string },
  ): Promise<string> {
    const payments = await this.paymentsRepository.findAll({ tenantId, ...filters });

    const header = csvRow([
      'id', 'receiptId', 'paymentDate', 'amount', 'method', 'methodDescription', 'createdAt',
    ]);

    const rows = payments.map((p) =>
      csvRow([
        p.id, p.receiptId,
        p.paymentDate.toISOString(),
        p.amount, p.method,
        p.methodDescription ?? null,
        p.createdAt.toISOString(),
      ]),
    );

    return [header, ...rows].join('\n');
  }
}
