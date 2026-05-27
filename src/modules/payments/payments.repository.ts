import { randomUUID } from 'crypto';
import { Payment } from './payments.types';

export interface IPaymentsRepository {
  countByReceipt(tenantId: string, receiptId: string): Promise<number>;
}

/// Implementacao in-memory usada nos testes.
export class InMemoryPaymentsRepository implements IPaymentsRepository {
  private readonly payments: Payment[] = [];

  async countByReceipt(tenantId: string, receiptId: string): Promise<number> {
    return this.payments.filter(
      (p) => p.tenantId === tenantId && p.receiptId === receiptId,
    ).length;
  }

  /// Util para testes que precisem semear pagamentos.
  __seed(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const p: Payment = { ...payment, id: randomUUID(), createdAt: new Date() };
    this.payments.push(p);
    return p;
  }
}
