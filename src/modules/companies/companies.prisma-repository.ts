import { prisma } from '../../lib/prisma';
import { ICompaniesRepository } from './companies.repository';
import { Company, ListCompaniesFilters } from './companies.types';

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function toCompany(record: {
  id: string;
  tenantId: string;
  name: string;
  cnpj: string;
  sector: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Company {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    cnpj: record.cnpj,
    sector: record.sector ?? undefined,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaCompaniesRepository implements ICompaniesRepository {
  async findAll(filters: ListCompaniesFilters): Promise<{ items: Company[]; total: number }> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.cnpj) {
      where.cnpj = { contains: normalizeCnpj(filters.cnpj) };
    }

    if (typeof filters.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    if (filters.sector) {
      where.sector = filters.sector;
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return { items: records.map(toCompany), total };
  }

  async findById(tenantId: string, id: string): Promise<Company | null> {
    const record = await prisma.company.findFirst({ where: { tenantId, id } });
    return record ? toCompany(record) : null;
  }

  async findByCnpj(tenantId: string, cnpj: string): Promise<Company | null> {
    const record = await prisma.company.findUnique({
      where: { tenantId_cnpj: { tenantId, cnpj: normalizeCnpj(cnpj) } },
    });
    return record ? toCompany(record) : null;
  }

  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const record = await prisma.company.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        cnpj: normalizeCnpj(data.cnpj),
        sector: data.sector,
        isActive: data.isActive,
      },
    });
    return toCompany(record);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Company, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Company | null> {
    const existing = await prisma.company.findFirst({ where: { tenantId, id } });
    if (!existing) return null;

    const record = await prisma.company.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.cnpj !== undefined && { cnpj: normalizeCnpj(data.cnpj) }),
        ...(data.sector !== undefined && { sector: data.sector }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return toCompany(record);
  }
}
