import { randomUUID } from 'crypto';
import { Demand, DemandStatus } from './demands.types';

export interface IDemandsRepository {
  findAll(tenantId: string): Promise<Demand[]>;
  findPendingByCompanyId(tenantId: string, companyId: string): Promise<Demand[]>;
  countPendingByCompanyId(tenantId: string, companyId: string): Promise<number>;
  create(data: Omit<Demand, 'id'>): Promise<Demand>;
}

const PENDING_STATUSES: DemandStatus[] = ['pending', 'in_progress', 'overdue'];

export class InMemoryDemandsRepository implements IDemandsRepository {
  private readonly demands: Demand[] = [];

  async findAll(tenantId: string): Promise<Demand[]> {
    return this.demands.filter((d) => d.tenantId === tenantId);
  }

  async findPendingByCompanyId(tenantId: string, companyId: string): Promise<Demand[]> {
    return this.demands.filter(
      (d) =>
        d.tenantId === tenantId &&
        d.companyId === companyId &&
        PENDING_STATUSES.includes(d.status),
    );
  }

  async countPendingByCompanyId(tenantId: string, companyId: string): Promise<number> {
    const pending = await this.findPendingByCompanyId(tenantId, companyId);
    return pending.length;
  }

  async create(data: Omit<Demand, 'id'>): Promise<Demand> {
    const demand: Demand = { ...data, id: randomUUID() };
    this.demands.push(demand);
    return demand;
  }
}
