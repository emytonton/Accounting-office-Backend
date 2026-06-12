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
  /// Calculado on-the-fly (US-D03 / RN-009): dueDate < agora && status != 'completed'.
  isOverdue?: boolean;
}

export interface UpdateDueDateDto {
  dueDate: Date | null;
}

export interface DashboardFilters {
  tenantId: string;
  competenceMonth: number;
  competenceYear: number;
  sector?: string;
  companyId?: string;
}

export interface DashboardCount {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface DashboardBreakdown {
  key: string;
  label?: string;
  counts: DashboardCount;
}

export interface DashboardResult {
  competence: { month: number; year: number };
  overall: DashboardCount;
  bySector: DashboardBreakdown[];
  byCompany: DashboardBreakdown[];
  isEmpty: boolean;
  message?: string;
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
