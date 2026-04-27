import { randomUUID } from 'crypto';
import { Company, ListCompaniesFilters } from './companies.types';

export interface ICompaniesRepository {
  findAll(filters: ListCompaniesFilters): Promise<{ items: Company[]; total: number }>;
  findById(tenantId: string, id: string): Promise<Company | null>;
  findByCnpj(tenantId: string, cnpj: string): Promise<Company | null>;
  create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Company, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Company | null>;
}

function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export class InMemoryCompaniesRepository implements ICompaniesRepository {
  private readonly companies: Company[] = [];

  async findAll(filters: ListCompaniesFilters): Promise<{ items: Company[]; total: number }> {
    let result = this.companies.filter((c) => c.tenantId === filters.tenantId);

    if (filters.name) {
      const term = filters.name.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(term));
    }

    if (filters.cnpj) {
      const term = normalizeCnpj(filters.cnpj);
      result = result.filter((c) => normalizeCnpj(c.cnpj).includes(term));
    }

    if (typeof filters.isActive === 'boolean') {
      result = result.filter((c) => c.isActive === filters.isActive);
    }

    if (filters.sector) {
      result = result.filter((c) => c.sector === filters.sector);
    }

    const total = result.length;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);

    return { items, total };
  }

  async findById(tenantId: string, id: string): Promise<Company | null> {
    return this.companies.find((c) => c.tenantId === tenantId && c.id === id) ?? null;
  }

  async findByCnpj(tenantId: string, cnpj: string): Promise<Company | null> {
    const target = normalizeCnpj(cnpj);
    return (
      this.companies.find(
        (c) => c.tenantId === tenantId && normalizeCnpj(c.cnpj) === target,
      ) ?? null
    );
  }

  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const now = new Date();
    const company: Company = {
      ...data,
      cnpj: normalizeCnpj(data.cnpj),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.companies.push(company);
    return company;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<Company, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Company | null> {
    const company = this.companies.find((c) => c.tenantId === tenantId && c.id === id);
    if (!company) return null;
    if (data.name !== undefined) company.name = data.name;
    if (data.cnpj !== undefined) company.cnpj = normalizeCnpj(data.cnpj);
    if (data.sector !== undefined) company.sector = data.sector;
    if (data.isActive !== undefined) company.isActive = data.isActive;
    company.updatedAt = new Date();
    return company;
  }
}
