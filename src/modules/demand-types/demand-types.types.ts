export interface SubtaskTemplate {
  id: string;
  tenantId: string;
  demandTypeId: string;
  name: string;
  isRequired: boolean;
  orderIndex: number;
}

export interface DemandType {
  id: string;
  tenantId: string;
  sector: string;
  name: string;
  hasSubtasks: boolean;
  isActive: boolean;
  subtaskTemplates?: SubtaskTemplate[];
}

export interface CreateSubtaskTemplateDto {
  name: string;
  isRequired?: boolean;
  orderIndex?: number;
}

export interface CreateDemandTypeDto {
  tenantId: string;
  sector: string;
  name: string;
  hasSubtasks?: boolean;
  subtaskTemplates?: CreateSubtaskTemplateDto[];
}

export type UpdateDemandTypeDto = Partial<{
  sector: string;
  name: string;
  hasSubtasks: boolean;
  isActive: boolean;
}>;

export interface ListDemandTypesFilters {
  tenantId: string;
  sector?: string;
  isActive?: boolean;
}
