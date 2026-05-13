import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { CompanyDemandTypeLink, CreateLinkDto, UpdateLinkDto } from './links.types';

export interface ILinksRepository {
  findByCompany(tenantId: string, companyId: string): Promise<CompanyDemandTypeLink[]>;
  findOne(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
  ): Promise<CompanyDemandTypeLink | null>;
  findById(tenantId: string, id: string): Promise<CompanyDemandTypeLink | null>;
  create(dto: CreateLinkDto): Promise<CompanyDemandTypeLink>;
  update(
    tenantId: string,
    id: string,
    dto: UpdateLinkDto,
  ): Promise<CompanyDemandTypeLink | null>;
  /// Lista vínculos ATIVOS de empresas ATIVAS para um tenant.
  /// Usado pela geração de demandas (US-D01).
  findActiveLinksForGeneration(
    tenantId: string,
    companyIds?: string[],
  ): Promise<CompanyDemandTypeLink[]>;
}

type RawLink = {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  subtasksEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toLink(record: RawLink): CompanyDemandTypeLink {
  return {
    id: record.id,
    tenantId: record.tenantId,
    companyId: record.companyId,
    demandTypeId: record.demandTypeId,
    subtasksEnabled: record.subtasksEnabled,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaLinksRepository implements ILinksRepository {
  async findByCompany(tenantId: string, companyId: string): Promise<CompanyDemandTypeLink[]> {
    const records = await prisma.companyDemandTypeLink.findMany({
      where: { tenantId, companyId },
    });
    return records.map(toLink);
  }

  async findOne(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
  ): Promise<CompanyDemandTypeLink | null> {
    const record = await prisma.companyDemandTypeLink.findUnique({
      where: { tenantId_companyId_demandTypeId: { tenantId, companyId, demandTypeId } },
    });
    return record ? toLink(record) : null;
  }

  async findById(tenantId: string, id: string): Promise<CompanyDemandTypeLink | null> {
    const record = await prisma.companyDemandTypeLink.findFirst({ where: { tenantId, id } });
    return record ? toLink(record) : null;
  }

  async create(dto: CreateLinkDto): Promise<CompanyDemandTypeLink> {
    const record = await prisma.companyDemandTypeLink.create({
      data: {
        tenantId: dto.tenantId,
        companyId: dto.companyId,
        demandTypeId: dto.demandTypeId,
        subtasksEnabled: dto.subtasksEnabled ?? true,
        isActive: true,
      },
    });
    return toLink(record);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateLinkDto,
  ): Promise<CompanyDemandTypeLink | null> {
    const existing = await prisma.companyDemandTypeLink.findFirst({ where: { tenantId, id } });
    if (!existing) return null;
    const record = await prisma.companyDemandTypeLink.update({
      where: { id },
      data: {
        ...(dto.subtasksEnabled !== undefined && { subtasksEnabled: dto.subtasksEnabled }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return toLink(record);
  }

  async findActiveLinksForGeneration(
    tenantId: string,
    companyIds?: string[],
  ): Promise<CompanyDemandTypeLink[]> {
    const records = await prisma.companyDemandTypeLink.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(companyIds ? { companyId: { in: companyIds } } : {}),
      },
    });
    return records.map(toLink);
  }
}

export class InMemoryLinksRepository implements ILinksRepository {
  private readonly links: RawLink[] = [];

  async findByCompany(tenantId: string, companyId: string): Promise<CompanyDemandTypeLink[]> {
    return this.links
      .filter((l) => l.tenantId === tenantId && l.companyId === companyId)
      .map(toLink);
  }

  async findOne(
    tenantId: string,
    companyId: string,
    demandTypeId: string,
  ): Promise<CompanyDemandTypeLink | null> {
    const r = this.links.find(
      (l) =>
        l.tenantId === tenantId &&
        l.companyId === companyId &&
        l.demandTypeId === demandTypeId,
    );
    return r ? toLink(r) : null;
  }

  async findById(tenantId: string, id: string): Promise<CompanyDemandTypeLink | null> {
    const r = this.links.find((l) => l.tenantId === tenantId && l.id === id);
    return r ? toLink(r) : null;
  }

  async create(dto: CreateLinkDto): Promise<CompanyDemandTypeLink> {
    const now = new Date();
    const link: RawLink = {
      id: randomUUID(),
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      demandTypeId: dto.demandTypeId,
      subtasksEnabled: dto.subtasksEnabled ?? true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.links.push(link);
    return toLink(link);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateLinkDto,
  ): Promise<CompanyDemandTypeLink | null> {
    const link = this.links.find((l) => l.tenantId === tenantId && l.id === id);
    if (!link) return null;
    if (dto.subtasksEnabled !== undefined) link.subtasksEnabled = dto.subtasksEnabled;
    if (dto.isActive !== undefined) link.isActive = dto.isActive;
    link.updatedAt = new Date();
    return toLink(link);
  }

  async findActiveLinksForGeneration(
    tenantId: string,
    companyIds?: string[],
  ): Promise<CompanyDemandTypeLink[]> {
    return this.links
      .filter(
        (l) =>
          l.tenantId === tenantId &&
          l.isActive &&
          (!companyIds || companyIds.includes(l.companyId)),
      )
      .map(toLink);
  }
}
