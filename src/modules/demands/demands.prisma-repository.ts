import { prisma } from '../../lib/prisma';
import { IDemandsRepository } from './demands.repository';
import { Demand, DemandStatus } from './demands.types';

const PENDING_STATUSES: DemandStatus[] = ['pending', 'in_progress', 'overdue'];

function toDemand(record: {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  competenceMonth: number;
  competenceYear: number;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
}): Demand {
  return {
    id: record.id,
    tenantId: record.tenantId,
    companyId: record.companyId,
    demandTypeId: record.demandTypeId,
    competenceMonth: record.competenceMonth,
    competenceYear: record.competenceYear,
    status: record.status as DemandStatus,
    dueDate: record.dueDate ?? undefined,
    completedAt: record.completedAt ?? undefined,
  };
}

export class PrismaDemandsRepository implements IDemandsRepository {
  async findAll(tenantId: string): Promise<Demand[]> {
    const records = await prisma.demand.findMany({
      where: { tenantId },
      orderBy: { competenceYear: 'desc' },
    });
    return records.map(toDemand);
  }

  async findPendingByCompanyId(tenantId: string, companyId: string): Promise<Demand[]> {
    const records = await prisma.demand.findMany({
      where: {
        tenantId,
        companyId,
        status: { in: PENDING_STATUSES },
      },
    });
    return records.map(toDemand);
  }

  async countPendingByCompanyId(tenantId: string, companyId: string): Promise<number> {
    return prisma.demand.count({
      where: {
        tenantId,
        companyId,
        status: { in: PENDING_STATUSES },
      },
    });
  }

  async create(data: Omit<Demand, 'id'>): Promise<Demand> {
    const record = await prisma.demand.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId,
        demandTypeId: data.demandTypeId,
        competenceMonth: data.competenceMonth,
        competenceYear: data.competenceYear,
        status: data.status,
        dueDate: data.dueDate,
        completedAt: data.completedAt,
      },
    });
    return toDemand(record);
  }
}
