import { randomUUID } from 'crypto';
import { Demand, DemandStatus, ListDemandsFilters, Subtask } from './demands.types';

const PENDING_STATUSES: DemandStatus[] = ['pending', 'in_progress', 'overdue'];

export interface IDemandsRepository {
  findAll(filters: ListDemandsFilters): Promise<Demand[]>;
  findById(tenantId: string, id: string): Promise<Demand | null>;
  findByCompetence(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
    competenceMonth: number,
    competenceYear: number,
  ): Promise<Demand | null>;
  findPendingByCompanyId(tenantId: string, companyId: string): Promise<Demand[]>;
  countPendingByCompanyId(tenantId: string, companyId: string): Promise<number>;
  /// Cria a demanda + suas subtarefas (templates copiados) em uma única transação.
  createWithSubtasks(
    demand: Omit<Demand, 'id' | 'subtasks' | 'createdAt' | 'updatedAt' | 'completedAt'>,
    subtasks: { name: string; isRequired: boolean; orderIndex: number }[],
  ): Promise<Demand>;
  updateStatus(
    tenantId: string,
    id: string,
    status: DemandStatus,
    completedAt: Date | null,
  ): Promise<Demand | null>;
  findSubtaskById(tenantId: string, subtaskId: string): Promise<Subtask | null>;
  markSubtask(
    tenantId: string,
    subtaskId: string,
    completedAt: Date | null,
  ): Promise<Subtask | null>;
}

export { PENDING_STATUSES };

export class InMemoryDemandsRepository implements IDemandsRepository {
  private readonly demands: (Demand & { subtasks: Subtask[] })[] = [];

  async findAll(filters: ListDemandsFilters): Promise<Demand[]> {
    return this.demands.filter((d) => {
      if (d.tenantId !== filters.tenantId) return false;
      if (filters.companyId && d.companyId !== filters.companyId) return false;
      if (filters.demandTypeId && d.demandTypeId !== filters.demandTypeId) return false;
      if (filters.status && d.status !== filters.status) return false;
      if (filters.competenceMonth && d.competenceMonth !== filters.competenceMonth) return false;
      if (filters.competenceYear && d.competenceYear !== filters.competenceYear) return false;
      return true;
    });
  }

  async findById(tenantId: string, id: string): Promise<Demand | null> {
    return this.demands.find((d) => d.tenantId === tenantId && d.id === id) ?? null;
  }

  async findByCompetence(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
    competenceMonth: number,
    competenceYear: number,
  ): Promise<Demand | null> {
    return (
      this.demands.find(
        (d) =>
          d.tenantId === tenantId &&
          d.companyId === companyId &&
          d.demandTypeId === demandTypeId &&
          d.competenceMonth === competenceMonth &&
          d.competenceYear === competenceYear,
      ) ?? null
    );
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
    return (await this.findPendingByCompanyId(tenantId, companyId)).length;
  }

  async createWithSubtasks(
    demand: Omit<Demand, 'id' | 'subtasks' | 'createdAt' | 'updatedAt' | 'completedAt'>,
    subtasks: { name: string; isRequired: boolean; orderIndex: number }[],
  ): Promise<Demand> {
    const id = randomUUID();
    const now = new Date();
    const created = {
      ...demand,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      subtasks: subtasks.map<Subtask>((s) => ({
        id: randomUUID(),
        tenantId: demand.tenantId,
        demandId: id,
        name: s.name,
        isRequired: s.isRequired,
        orderIndex: s.orderIndex,
        completedAt: null,
      })),
    };
    this.demands.push(created);
    return created;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: DemandStatus,
    completedAt: Date | null,
  ): Promise<Demand | null> {
    const d = this.demands.find((x) => x.tenantId === tenantId && x.id === id);
    if (!d) return null;
    d.status = status;
    d.completedAt = completedAt;
    d.updatedAt = new Date();
    return d;
  }

  async findSubtaskById(tenantId: string, subtaskId: string): Promise<Subtask | null> {
    for (const d of this.demands) {
      if (d.tenantId !== tenantId) continue;
      const s = d.subtasks.find((x) => x.id === subtaskId);
      if (s) return s;
    }
    return null;
  }

  async markSubtask(
    tenantId: string,
    subtaskId: string,
    completedAt: Date | null,
  ): Promise<Subtask | null> {
    for (const d of this.demands) {
      if (d.tenantId !== tenantId) continue;
      const s = d.subtasks.find((x) => x.id === subtaskId);
      if (s) {
        s.completedAt = completedAt;
        return s;
      }
    }
    return null;
  }
}
