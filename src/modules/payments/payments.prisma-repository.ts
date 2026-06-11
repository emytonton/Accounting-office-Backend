import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { IPaymentsRepository } from './payments.repository';
import { CreatePaymentDto, ListPaymentsFilters, Payment, PaymentMethod } from './payments.types';

type RawPayment = {
  id: string;
  tenantId: string;
  receiptId: string;
  paymentDate: Date;
  amount: Prisma.Decimal;
  method: string;
  methodDescription: string | null;
  createdAt: Date;
};

function toPayment(record: RawPayment): Payment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    receiptId: record.receiptId,
    paymentDate: record.paymentDate,
    amount: Number(record.amount),
    method: record.method as PaymentMethod,
    methodDescription: record.methodDescription,
    createdAt: record.createdAt,
  };
}

export class PrismaPaymentsRepository implements IPaymentsRepository {
  async findAll(filters: ListPaymentsFilters): Promise<Payment[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.receiptId) where.receiptId = filters.receiptId;
    const records = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
    });
    return records.map(toPayment);
  }

  async findById(tenantId: string, id: string): Promise<Payment | null> {
    const record = await prisma.payment.findFirst({ where: { tenantId, id } });
    return record ? toPayment(record) : null;
  }

  async create(data: CreatePaymentDto): Promise<Payment> {
    const record = await prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        receiptId: data.receiptId,
        paymentDate: data.paymentDate,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        methodDescription: data.methodDescription ?? null,
      },
    });
    return toPayment(record);
  }

  async sumByReceipt(tenantId: string, receiptId: string): Promise<number> {
    const agg = await prisma.payment.aggregate({
      where: { tenantId, receiptId },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }

  async countByReceipt(tenantId: string, receiptId: string): Promise<number> {
    return prisma.payment.count({ where: { tenantId, receiptId } });
  }
}
