export type DemandStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Subtask {
  id: string;
  tenantId: string;
  demandId: string;
  name: string;
  isRequired: boolean;
  orderIndex: number;
  completedAt?: Date | null;
}

export interface Demand {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  competenceMonth: number;
  competenceYear: number;
  status: DemandStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  subtasks?: Subtask[];
}

export type CreateDemandDto = Omit<
  Demand,
  'id' | 'status' | 'completedAt' | 'createdAt' | 'updatedAt' | 'subtasks'
>;

export interface OpenCompetenceDto {
  tenantId: string;
  competenceMonth: number;
  competenceYear: number;
  dueDate?: Date;
  companyIds?: string[];
}

export interface OpenCompetenceResult {
  created: number;
  skipped: number;
  details: {
    companyId: string;
    demandTypeId: string;
    status: 'created' | 'skipped_existing';
    demandId?: string;
  }[];
}

export interface ListDemandsFilters {
  tenantId: string;
  companyId?: string;
  demandTypeId?: string;
  status?: DemandStatus;
  competenceMonth?: number;
  competenceYear?: number;
  sector?: string;
}
