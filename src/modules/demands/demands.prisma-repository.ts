import { prisma } from '../../lib/prisma';
import { IDemandsRepository, PENDING_STATUSES } from './demands.repository';
import { Demand, DemandStatus, ListDemandsFilters, Subtask } from './demands.types';

type RawSubtask = {
  id: string;
  tenantId: string;
  demandId: string;
  name: string;
  isRequired: boolean;
  orderIndex: number;
  completedAt: Date | null;
};

type RawDemand = {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  competenceMonth: number;
  competenceYear: number;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toSubtask(record: RawSubtask): Subtask {
  return {
    id: record.id,
    tenantId: record.tenantId,
    demandId: record.demandId,
    name: record.name,
    isRequired: record.isRequired,
    orderIndex: record.orderIndex,
    completedAt: record.completedAt,
  };
}

function toDemand(record: RawDemand, subtasks?: RawSubtask[]): Demand {
  return {
    id: record.id,
    tenantId: record.tenantId,
    companyId: record.companyId,
    demandTypeId: record.demandTypeId,
    competenceMonth: record.competenceMonth,
    competenceYear: record.competenceYear,
    status: record.status as DemandStatus,
    dueDate: record.dueDate,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(subtasks ? { subtasks: subtasks.map(toSubtask) } : {}),
  };
}

export class PrismaDemandsRepository implements IDemandsRepository {
  async findAll(filters: ListDemandsFilters): Promise<Demand[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.demandTypeId) where.demandTypeId = filters.demandTypeId;
    if (filters.status) where.status = filters.status;
    if (filters.competenceMonth) where.competenceMonth = filters.competenceMonth;
    if (filters.competenceYear) where.competenceYear = filters.competenceYear;

    const records = await prisma.demand.findMany({
      where,
      include: { subtasks: { orderBy: { orderIndex: 'asc' } } },
      orderBy: [
        { competenceYear: 'desc' },
        { competenceMonth: 'desc' },
        { createdAt: 'asc' },
      ],
    });
    return records.map((r) => toDemand(r, r.subtasks));
  }

  async findById(tenantId: string, id: string): Promise<Demand | null> {
    const record = await prisma.demand.findFirst({
      where: { tenantId, id },
      include: { subtasks: { orderBy: { orderIndex: 'asc' } } },
    });
    return record ? toDemand(record, record.subtasks) : null;
  }

  async findByCompetence(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
    competenceMonth: number,
    competenceYear: number,
  ): Promise<Demand | null> {
    const record = await prisma.demand.findUnique({
      where: {
        tenantId_companyId_demandTypeId_competenceMonth_competenceYear: {
          tenantId,
          companyId,
          demandTypeId,
          competenceMonth,
          competenceYear,
        },
      },
      include: { subtasks: { orderBy: { orderIndex: 'asc' } } },
    });
    return record ? toDemand(record, record.subtasks) : null;
  }

  async findPendingByCompanyId(tenantId: string, companyId: string): Promise<Demand[]> {
    const records = await prisma.demand.findMany({
      where: {
        tenantId,
        companyId,
        status: { in: PENDING_STATUSES },
      },
    });
    return records.map((r) => toDemand(r));
  }

  async countPendingByCompanyId(tenantId: string, companyId: string): Promise<number> {
    return prisma.demand.count({
      where: { tenantId, companyId, status: { in: PENDING_STATUSES } },
    });
  }

  async createWithSubtasks(
    demand: Omit<Demand, 'id' | 'subtasks' | 'createdAt' | 'updatedAt' | 'completedAt'>,
    subtasks: { name: string; isRequired: boolean; orderIndex: number }[],
  ): Promise<Demand> {
    const record = await prisma.demand.create({
      data: {
        tenantId: demand.tenantId,
        companyId: demand.companyId,
        demandTypeId: demand.demandTypeId,
        competenceMonth: demand.competenceMonth,
        competenceYear: demand.competenceYear,
        status: demand.status,
        dueDate: demand.dueDate,
        ...(subtasks.length > 0
          ? {
              subtasks: {
                create: subtasks.map((s) => ({
                  tenantId: demand.tenantId,
                  name: s.name,
                  isRequired: s.isRequired,
                  orderIndex: s.orderIndex,
                })),
              },
            }
          : {}),
      },
      include: { subtasks: { orderBy: { orderIndex: 'asc' } } },
    });
    return toDemand(record, record.subtasks);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: DemandStatus,
    completedAt: Date | null,
  ): Promise<Demand | null> {
    const existing = await prisma.demand.findFirst({ where: { tenantId, id } });
    if (!existing) return null;
    const record = await prisma.demand.update({
      where: { id },
      data: { status, completedAt },
      include: { subtasks: { orderBy: { orderIndex: 'asc' } } },
    });
    return toDemand(record, record.subtasks);
  }

  async findSubtaskById(tenantId: string, subtaskId: string): Promise<Subtask | null> {
    const record = await prisma.subtask.findFirst({ where: { tenantId, id: subtaskId } });
    return record ? toSubtask(record) : null;
  }

  async markSubtask(
    tenantId: string,
    subtaskId: string,
    completedAt: Date | null,
  ): Promise<Subtask | null> {
    const existing = await prisma.subtask.findFirst({ where: { tenantId, id: subtaskId } });
    if (!existing) return null;
    const record = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completedAt },
    });
    return toSubtask(record);
  }
}
