import { ILinksRepository } from './links.repository';
import { ICompaniesRepository } from '../companies/companies.repository';
import { IDemandTypesRepository } from '../demand-types/demand-types.repository';
import {
  CatalogEntry,
  CompanyDemandTypeLink,
  CreateLinkDto,
  UpdateLinkDto,
} from './links.types';
import { AppError } from '../../shared/errors/AppError';

export class LinksService {
  constructor(
    private readonly repository: ILinksRepository,
    private readonly companiesRepository: ICompaniesRepository,
    private readonly demandTypesRepository: IDemandTypesRepository,
  ) {}

  /// Catálogo: lista todos os tipos de demanda do tenant indicando quais já estão
  /// vinculados a uma empresa específica. Útil para a tela de "vínculos da empresa".
  async catalogForCompany(tenantId: string, companyId: string): Promise<CatalogEntry[]> {
    const company = await this.companiesRepository.findById(tenantId, companyId);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');

    const [types, links] = await Promise.all([
      this.demandTypesRepository.findAll({ tenantId, isActive: true }),
      this.repository.findByCompany(tenantId, companyId),
    ]);

    const linkByType = new Map(links.map((l) => [l.demandTypeId, l]));

    return types.map<CatalogEntry>((dt) => {
      const link = linkByType.get(dt.id);
      return {
        demandTypeId: dt.id,
        name: dt.name,
        sector: dt.sector,
        hasSubtasks: dt.hasSubtasks,
        isActive: dt.isActive,
        linked: Boolean(link?.isActive),
        ...(link ? { linkId: link.id, subtasksEnabled: link.subtasksEnabled } : {}),
      };
    });
  }

  async listByCompany(
    tenantId: string,
    companyId: string,
  ): Promise<CompanyDemandTypeLink[]> {
    const company = await this.companiesRepository.findById(tenantId, companyId);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    return this.repository.findByCompany(tenantId, companyId);
  }

  async create(dto: CreateLinkDto): Promise<CompanyDemandTypeLink> {
    const company = await this.companiesRepository.findById(dto.tenantId, dto.companyId);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    if (!company.isActive) {
      throw new AppError(
        'Cannot link demand types to inactive company',
        409,
        'COMPANY_INACTIVE',
      );
    }

    const demandType = await this.demandTypesRepository.findById(
      dto.tenantId,
      dto.demandTypeId,
    );
    if (!demandType) throw new AppError('Demand type not found', 404, 'NOT_FOUND');
    if (!demandType.isActive) {
      throw new AppError(
        'Cannot link an inactive demand type',
        409,
        'DEMAND_TYPE_INACTIVE',
      );
    }

    // Se existe um vínculo (mesmo inativo), reativa em vez de criar duplicado.
    const existing = await this.repository.findOne(
      dto.tenantId,
      dto.companyId,
      dto.demandTypeId,
    );
    if (existing) {
      if (existing.isActive) {
        throw new AppError('Link already exists', 409, 'LINK_ALREADY_EXISTS');
      }
      const updated = await this.repository.update(dto.tenantId, existing.id, {
        isActive: true,
        subtasksEnabled: dto.subtasksEnabled ?? existing.subtasksEnabled,
      });
      return updated as CompanyDemandTypeLink;
    }

    return this.repository.create(dto);
  }

  async update(
    tenantId: string,
    linkId: string,
    dto: UpdateLinkDto,
  ): Promise<CompanyDemandTypeLink> {
    const updated = await this.repository.update(tenantId, linkId, dto);
    if (!updated) throw new AppError('Link not found', 404, 'NOT_FOUND');
    return updated;
  }

  /// Remove um vínculo via soft-delete (isActive=false) para preservar
  /// instâncias históricas de demandas geradas antes da remoção (RN-018).
  async remove(tenantId: string, linkId: string): Promise<CompanyDemandTypeLink> {
    const link = await this.repository.findById(tenantId, linkId);
    if (!link) throw new AppError('Link not found', 404, 'NOT_FOUND');
    if (!link.isActive) {
      throw new AppError('Link is already inactive', 409, 'ALREADY_INACTIVE');
    }
    const updated = await this.repository.update(tenantId, linkId, { isActive: false });
    return updated as CompanyDemandTypeLink;
  }

  async toggleSubtasks(
    tenantId: string,
    linkId: string,
    subtasksEnabled: boolean,
  ): Promise<CompanyDemandTypeLink> {
    return this.update(tenantId, linkId, { subtasksEnabled });
  }
}
