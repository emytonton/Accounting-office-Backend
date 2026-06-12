import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { IReceiptsRepository } from './receipts.repository';
import { ListReceiptsFilters, Receipt, ReceiptStatus } from './receipts.types';

type RawReceipt = {
  id: string;
  tenantId: string;
  companyId: string;
  number: number;
  year: number;
  competenceMonth: number;
  competenceYear: number;
  amount: Prisma.Decimal;
  status: string;
  cancelReason: string | null;
  originalReceiptId: string | null;
  createdAt: Date;
};

function toReceipt(record: RawReceipt): Receipt {
  return {
    id: record.id,
    tenantId: record.tenantId,
    companyId: record.companyId,
    number: record.number,
    year: record.year,
    competenceMonth: record.competenceMonth,
    competenceYear: record.competenceYear,
    amount: Number(record.amount),
    status: record.status as ReceiptStatus,
    cancelReason: record.cancelReason,
    originalReceiptId: record.originalReceiptId,
    createdAt: record.createdAt,
  };
}

const MAX_RETRIES = 3;

export class PrismaReceiptsRepository implements IReceiptsRepository {
  async findAll(filters: ListReceiptsFilters): Promise<Receipt[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.year) where.year = filters.year;
    if (filters.status) where.status = filters.status;
    if (filters.competenceMonth) where.competenceMonth = filters.competenceMonth;
    if (filters.competenceYear) where.competenceYear = filters.competenceYear;

    const records = await prisma.receipt.findMany({
      where,
      orderBy: [{ year: 'desc' }, { number: 'desc' }],
    });
    return records.map(toReceipt);
  }

  async findById(tenantId: string, id: string): Promise<Receipt | null> {
    const record = await prisma.receipt.findFirst({ where: { tenantId, id } });
    return record ? toReceipt(record) : null;
  }

  /// Numeracao sequencial por (tenant, year) com retry em caso de race condition.
  /// Estrategia: pega max(number) atual e tenta inserir number+1. Se outra
  /// transacao concorrente pegou o mesmo numero (unique constraint), tenta de
  /// novo ate MAX_RETRIES.
  async create(
    data: Omit<Receipt, 'id' | 'number' | 'status' | 'createdAt'>,
  ): Promise<Receipt> {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const agg = await tx.receipt.aggregate({
            where: { tenantId: data.tenantId, year: data.year },
            _max: { number: true },
          });
          const nextNumber = (agg._max.number ?? 0) + 1;
          return tx.receipt.create({
            data: {
              tenantId: data.tenantId,
              companyId: data.companyId,
              number: nextNumber,
              year: data.year,
              competenceMonth: data.competenceMonth,
              competenceYear: data.competenceYear,
              amount: new Prisma.Decimal(data.amount),
              status: 'active',
              originalReceiptId: data.originalReceiptId ?? null,
            },
          });
        });
        return toReceipt(result);
      } catch (err) {
        // Codigo P2002 = violacao de unique constraint
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to create receipt after retries');
  }

  async cancel(
    tenantId: string,
    id: string,
    reason: string,
  ): Promise<Receipt | null> {
    const existing = await prisma.receipt.findFirst({ where: { tenantId, id } });
    if (!existing) return null;
    const record = await prisma.receipt.update({
      where: { id },
      data: { status: 'cancelled', cancelReason: reason },
    });
    return toReceipt(record);
  }
}
