import { randomUUID } from 'crypto';
import { CreatePaymentDto, ListPaymentsFilters, Payment } from './payments.types';

export interface IPaymentsRepository {
  findAll(filters: ListPaymentsFilters): Promise<Payment[]>;
  findById(tenantId: string, id: string): Promise<Payment | null>;
  create(data: CreatePaymentDto): Promise<Payment>;
  sumByReceipt(tenantId: string, receiptId: string): Promise<number>;
  countByReceipt(tenantId: string, receiptId: string): Promise<number>;
}

export class InMemoryPaymentsRepository implements IPaymentsRepository {
  private readonly payments: Payment[] = [];

  async findAll(filters: ListPaymentsFilters): Promise<Payment[]> {
    return this.payments.filter((p) => {
      if (p.tenantId !== filters.tenantId) return false;
      if (filters.receiptId && p.receiptId !== filters.receiptId) return false;
      return true;
    });
  }

  async findById(tenantId: string, id: string): Promise<Payment | null> {
    return this.payments.find((p) => p.tenantId === tenantId && p.id === id) ?? null;
  }

  async create(data: CreatePaymentDto): Promise<Payment> {
    const payment: Payment = { ...data, id: randomUUID(), createdAt: new Date() };
    this.payments.push(payment);
    return payment;
  }

  async sumByReceipt(tenantId: string, receiptId: string): Promise<number> {
    return this.payments
      .filter((p) => p.tenantId === tenantId && p.receiptId === receiptId)
      .reduce((acc, p) => acc + p.amount, 0);
  }

  async countByReceipt(tenantId: string, receiptId: string): Promise<number> {
    return this.payments.filter(
      (p) => p.tenantId === tenantId && p.receiptId === receiptId,
    ).length;
  }

  __seed(payment: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const p: Payment = { ...payment, id: randomUUID(), createdAt: new Date() };
    this.payments.push(p);
    return p;
  }
}
