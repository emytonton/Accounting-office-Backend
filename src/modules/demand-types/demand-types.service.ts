import { IDemandTypesRepository } from './demand-types.repository';
import {
  CreateDemandTypeDto,
  CreateSubtaskTemplateDto,
  DemandType,
  ListDemandTypesFilters,
  SubtaskTemplate,
  UpdateDemandTypeDto,
} from './demand-types.types';
import { AppError } from '../../shared/errors/AppError';

export class DemandTypesService {
  constructor(private readonly repository: IDemandTypesRepository) {}

  async findAll(filters: ListDemandTypesFilters): Promise<DemandType[]> {
    return this.repository.findAll(filters);
  }

  async findById(tenantId: string, id: string): Promise<DemandType> {
    const dt = await this.repository.findById(tenantId, id);
    if (!dt) throw new AppError('Demand type not found', 404, 'NOT_FOUND');
    return dt;
  }

  async create(dto: CreateDemandTypeDto): Promise<DemandType> {
    // Se vier subtasks, força hasSubtasks=true automaticamente.
    const normalized: CreateDemandTypeDto = {
      ...dto,
      hasSubtasks:
        dto.subtaskTemplates && dto.subtaskTemplates.length > 0
          ? true
          : dto.hasSubtasks ?? false,
    };
    return this.repository.create(normalized);
  }

  async update(tenantId: string, id: string, dto: UpdateDemandTypeDto): Promise<DemandType> {
    const updated = await this.repository.update(tenantId, id, dto);
    if (!updated) throw new AppError('Demand type not found', 404, 'NOT_FOUND');
    return updated;
  }

  async addSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    dto: CreateSubtaskTemplateDto,
  ): Promise<SubtaskTemplate> {
    await this.findById(tenantId, demandTypeId);
    return this.repository.addSubtaskTemplate(tenantId, demandTypeId, dto);
  }

  async removeSubtaskTemplate(
    tenantId: string,
    demandTypeId: string,
    templateId: string,
  ): Promise<void> {
    const ok = await this.repository.removeSubtaskTemplate(tenantId, demandTypeId, templateId);
    if (!ok) throw new AppError('Subtask template not found', 404, 'NOT_FOUND');
  }
}
