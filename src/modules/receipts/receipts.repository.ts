import { randomUUID } from 'crypto';
import { ListReceiptsFilters, Receipt } from './receipts.types';

export interface IReceiptsRepository {
  findAll(filters: ListReceiptsFilters): Promise<Receipt[]>;
  findById(tenantId: string, id: string): Promise<Receipt | null>;
  create(data: Omit<Receipt, 'id' | 'number' | 'status' | 'createdAt'>): Promise<Receipt>;
  cancel(tenantId: string, id: string, reason: string): Promise<Receipt | null>;
  /// US-H03b: marca o recibo como quitado ao atingir o valor total.
  setPaidAt(tenantId: string, id: string, paidAt: Date): Promise<Receipt | null>;
}

export class InMemoryReceiptsRepository implements IReceiptsRepository {
  private readonly receipts: Receipt[] = [];

  async findAll(filters: ListReceiptsFilters): Promise<Receipt[]> {
    return this.receipts.filter((r) => {
      if (r.tenantId !== filters.tenantId) return false;
      if (filters.companyId && r.companyId !== filters.companyId) return false;
      if (filters.year && r.year !== filters.year) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.competenceMonth && r.competenceMonth !== filters.competenceMonth) return false;
      if (filters.competenceYear && r.competenceYear !== filters.competenceYear) return false;
      return true;
    });
  }

  async findById(tenantId: string, id: string): Promise<Receipt | null> {
    return this.receipts.find((r) => r.tenantId === tenantId && r.id === id) ?? null;
  }

  async create(
    data: Omit<Receipt, 'id' | 'number' | 'status' | 'createdAt'>,
  ): Promise<Receipt> {
    const year = data.year;
    const maxForYear = this.receipts
      .filter((r) => r.tenantId === data.tenantId && r.year === year)
      .reduce((acc, r) => Math.max(acc, r.number), 0);

    const receipt: Receipt = {
      ...data,
      id: randomUUID(),
      number: maxForYear + 1,
      status: 'active',
      createdAt: new Date(),
    };
    this.receipts.push(receipt);
    return receipt;
  }

  async cancel(tenantId: string, id: string, reason: string): Promise<Receipt | null> {
    const receipt = this.receipts.find((r) => r.tenantId === tenantId && r.id === id);
    if (!receipt) return null;
    receipt.status = 'cancelled';
    receipt.cancelReason = reason;
    return receipt;
  }

  async setPaidAt(tenantId: string, id: string, paidAt: Date): Promise<Receipt | null> {
    const receipt = this.receipts.find((r) => r.tenantId === tenantId && r.id === id);
    if (!receipt) return null;
    receipt.paidAt = paidAt;
    return receipt;
  }
}
