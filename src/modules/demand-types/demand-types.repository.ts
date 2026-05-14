import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import {
  CreateDemandTypeDto,
  CreateSubtaskTemplateDto,
  DemandType,
  ListDemandTypesFilters,
  SubtaskTemplate,
  UpdateDemandTypeDto,
} from './demand-types.types';

export interface IDemandTypesRepository {
  findAll(filters: ListDemandTypesFilters): Promise<DemandType[]>;
  findById(tenantId: string, id: string): Promise<DemandType | null>;
  create(dto: CreateDemandTypeDto): Promise<DemandType>;
  update(tenantId: string, id: string, dto: UpdateDemandTypeDto): Promise<DemandType | null>;
  listSubtaskTemplates(tenantId: string, demandTypeId: string): Promise<SubtaskTemplate[]>;
  addSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    dto: CreateSubtaskTemplateDto,
  ): Promise<SubtaskTemplate>;
  removeSubtaskTemplate(tenantId: string, demandTypeId: string, id: string): Promise<boolean>;
}

type RawDemandType = {
  id: string;
  tenantId: string;
  sector: string;
  name: string;
  hasSubtasks: boolean;
  isActive: boolean;
};

type RawSubtaskTemplate = {
  id: string;
  tenantId: string;
  demandTypeId: string;
  name: string;
  isRequired: boolean;
  orderIndex: number;
};

function toDemandType(record: RawDemandType, templates?: RawSubtaskTemplate[]): DemandType {
  return {
    id: record.id,
    tenantId: record.tenantId,
    sector: record.sector,
    name: record.name,
    hasSubtasks: record.hasSubtasks,
    isActive: record.isActive,
    ...(templates ? { subtaskTemplates: templates.map(toSubtask) } : {}),
  };
}

function toSubtask(record: RawSubtaskTemplate): SubtaskTemplate {
  return {
    id: record.id,
    tenantId: record.tenantId,
    demandTypeId: record.demandTypeId,
    name: record.name,
    isRequired: record.isRequired,
    orderIndex: record.orderIndex,
  };
}

export class PrismaDemandTypesRepository implements IDemandTypesRepository {
  async findAll(filters: ListDemandTypesFilters): Promise<DemandType[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.sector) where.sector = filters.sector;
    if (typeof filters.isActive === 'boolean') where.isActive = filters.isActive;

    const records = await prisma.demandType.findMany({
      where,
      include: { subtaskTemplates: { orderBy: { orderIndex: 'asc' } } },
      orderBy: [{ sector: 'asc' }, { name: 'asc' }],
    });
    return records.map((r) => toDemandType(r, r.subtaskTemplates));
  }

  async findById(tenantId: string, id: string): Promise<DemandType | null> {
    const record = await prisma.demandType.findFirst({
      where: { tenantId, id },
      include: { subtaskTemplates: { orderBy: { orderIndex: 'asc' } } },
    });
    return record ? toDemandType(record, record.subtaskTemplates) : null;
  }

  async create(dto: CreateDemandTypeDto): Promise<DemandType> {
    const record = await prisma.demandType.create({
      data: {
        tenantId: dto.tenantId,
        sector: dto.sector,
        name: dto.name,
        hasSubtasks: dto.hasSubtasks ?? false,
        isActive: true,
        ...(dto.subtaskTemplates && dto.subtaskTemplates.length > 0
          ? {
              subtaskTemplates: {
                create: dto.subtaskTemplates.map((t, idx) => ({
                  tenantId: dto.tenantId,
                  name: t.name,
                  isRequired: t.isRequired ?? true,
                  orderIndex: t.orderIndex ?? idx,
                })),
              },
            }
          : {}),
      },
      include: { subtaskTemplates: { orderBy: { orderIndex: 'asc' } } },
    });
    return toDemandType(record, record.subtaskTemplates);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDemandTypeDto,
  ): Promise<DemandType | null> {
    const existing = await prisma.demandType.findFirst({ where: { tenantId, id } });
    if (!existing) return null;

    const record = await prisma.demandType.update({
      where: { id },
      data: {
        ...(dto.sector !== undefined && { sector: dto.sector }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.hasSubtasks !== undefined && { hasSubtasks: dto.hasSubtasks }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { subtaskTemplates: { orderBy: { orderIndex: 'asc' } } },
    });
    return toDemandType(record, record.subtaskTemplates);
  }

  async listSubtaskTemplates(
    tenantId: string,
    demandTypeId: string,
  ): Promise<SubtaskTemplate[]> {
    const records = await prisma.subtaskTemplate.findMany({
      where: { tenantId, demandTypeId },
      orderBy: { orderIndex: 'asc' },
    });
    return records.map(toSubtask);
  }

  async addSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    dto: CreateSubtaskTemplateDto,
  ): Promise<SubtaskTemplate> {
    const record = await prisma.subtaskTemplate.create({
      data: {
        tenantId,
        demandTypeId,
        name: dto.name,
        isRequired: dto.isRequired ?? true,
        orderIndex: dto.orderIndex ?? 0,
      },
    });
    return toSubtask(record);
  }

  async removeSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    id: string,
  ): Promise<boolean> {
    const existing = await prisma.subtaskTemplate.findFirst({
      where: { tenantId, demandTypeId, id },
    });
    if (!existing) return false;
    await prisma.subtaskTemplate.delete({ where: { id } });
    return true;
  }
}

export class InMemoryDemandTypesRepository implements IDemandTypesRepository {
  private readonly types: (RawDemandType & { subtaskTemplates: RawSubtaskTemplate[] })[] = [];

  async findAll(filters: ListDemandTypesFilters): Promise<DemandType[]> {
    let result = this.types.filter((t) => t.tenantId === filters.tenantId);
    if (filters.sector) result = result.filter((t) => t.sector === filters.sector);
    if (typeof filters.isActive === 'boolean') {
      result = result.filter((t) => t.isActive === filters.isActive);
    }
    return result.map((r) => toDemandType(r, r.subtaskTemplates));
  }

  async findById(tenantId: string, id: string): Promise<DemandType | null> {
    const record = this.types.find((t) => t.tenantId === tenantId && t.id === id);
    return record ? toDemandType(record, record.subtaskTemplates) : null;
  }

  async create(dto: CreateDemandTypeDto): Promise<DemandType> {
    const id = randomUUID();
    const templates: RawSubtaskTemplate[] = (dto.subtaskTemplates ?? []).map((t, idx) => ({
      id: randomUUID(),
      tenantId: dto.tenantId,
      demandTypeId: id,
      name: t.name,
      isRequired: t.isRequired ?? true,
      orderIndex: t.orderIndex ?? idx,
    }));
    const record = {
      id,
      tenantId: dto.tenantId,
      sector: dto.sector,
      name: dto.name,
      hasSubtasks: dto.hasSubtasks ?? false,
      isActive: true,
      subtaskTemplates: templates,
    };
    this.types.push(record);
    return toDemandType(record, templates);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDemandTypeDto,
  ): Promise<DemandType | null> {
    const record = this.types.find((t) => t.tenantId === tenantId && t.id === id);
    if (!record) return null;
    if (dto.sector !== undefined) record.sector = dto.sector;
    if (dto.name !== undefined) record.name = dto.name;
    if (dto.hasSubtasks !== undefined) record.hasSubtasks = dto.hasSubtasks;
    if (dto.isActive !== undefined) record.isActive = dto.isActive;
    return toDemandType(record, record.subtaskTemplates);
  }

  async listSubtaskTemplates(
    tenantId: string,
    demandTypeId: string,
  ): Promise<SubtaskTemplate[]> {
    const record = this.types.find(
      (t) => t.tenantId === tenantId && t.id === demandTypeId,
    );
    return record ? record.subtaskTemplates.map(toSubtask) : [];
  }

  async addSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    dto: CreateSubtaskTemplateDto,
  ): Promise<SubtaskTemplate> {
    const record = this.types.find(
      (t) => t.tenantId === tenantId && t.id === demandTypeId,
    );
    if (!record) throw new Error('demand type not found');
    const template: RawSubtaskTemplate = {
      id: randomUUID(),
      tenantId,
      demandTypeId,
      name: dto.name,
      isRequired: dto.isRequired ?? true,
      orderIndex: dto.orderIndex ?? record.subtaskTemplates.length,
    };
    record.subtaskTemplates.push(template);
    return toSubtask(template);
  }

  async removeSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    id: string,
  ): Promise<boolean> {
    const record = this.types.find(
      (t) => t.tenantId === tenantId && t.id === demandTypeId,
    );
    if (!record) return false;
    const idx = record.subtaskTemplates.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    record.subtaskTemplates.splice(idx, 1);
    return true;
  }
}
