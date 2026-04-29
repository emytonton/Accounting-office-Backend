import { ICompaniesRepository } from './companies.repository';
import { IDemandsRepository } from '../demands/demands.repository';
import {
  Company,
  CreateCompanyDto,
  ListCompaniesFilters,
  PaginatedCompanies,
  UpdateCompanyDto,
} from './companies.types';
import { AppError } from '../../shared/errors/AppError';
import { AuthenticatedUser } from '../../shared/types';

export class CompaniesService {
  constructor(
    private readonly repository: ICompaniesRepository,
    private readonly demandsRepository: IDemandsRepository,
  ) {}

  async findAll(filters: ListCompaniesFilters, user?: AuthenticatedUser): Promise<PaginatedCompanies> {
    // RN-013: scope-based access. Collaborator only sees companies of their sector.
    const scopedFilters: ListCompaniesFilters = { ...filters };
    if (user && user.role === 'collaborator') {
      scopedFilters.sector = user.sector;
    }

    const { items, total } = await this.repository.findAll(scopedFilters);
    const page = scopedFilters.page ?? 1;
    const limit = scopedFilters.limit ?? 20;

    return {
      items,
      total,
      page,
      limit,
      message: items.length === 0 ? 'No companies found for the provided filters' : undefined,
    };
  }

  async findById(tenantId: string, id: string): Promise<Company> {
    const company = await this.repository.findById(tenantId, id);
    if (!company) {
      throw new AppError('Company not found', 404, 'NOT_FOUND');
    }
    return company;
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.repository.findByCnpj(dto.tenantId, dto.cnpj);
    if (existing) {
      throw new AppError('CNPJ already registered for this tenant', 409, 'CNPJ_ALREADY_EXISTS');
    }

    return this.repository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      cnpj: dto.cnpj,
      sector: dto.sector,
      isActive: true,
    });
  }

  async update(tenantId: string, id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.repository.findById(tenantId, id);
    if (!company) {
      throw new AppError('Company not found', 404, 'NOT_FOUND');
    }

    if (dto.cnpj && dto.cnpj !== company.cnpj) {
      const conflict = await this.repository.findByCnpj(tenantId, dto.cnpj);
      if (conflict && conflict.id !== id) {
        throw new AppError('CNPJ already registered for this tenant', 409, 'CNPJ_ALREADY_EXISTS');
      }
    }

    const updated = await this.repository.update(tenantId, id, dto);
    return updated as Company;
  }

  async inactivate(tenantId: string, id: string, force = false): Promise<Company> {
    const company = await this.repository.findById(tenantId, id);
    if (!company) {
      throw new AppError('Company not found', 404, 'NOT_FOUND');
    }

    if (!company.isActive) {
      throw new AppError('Company is already inactive', 409, 'ALREADY_INACTIVE');
    }

    // RN-003: history is preserved on inactivation; existing demands are not removed.
    const pending = await this.demandsRepository.countPendingByCompanyId(tenantId, id);
    if (pending > 0 && !force) {
      throw new AppError(
        `Company has ${pending} pending demand(s). Confirm with force=true to inactivate.`,
        409,
        'PENDING_DEMANDS',
      );
    }

    const updated = await this.repository.update(tenantId, id, { isActive: false });
    return updated as Company;
  }
}
