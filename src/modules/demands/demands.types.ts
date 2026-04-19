export type DemandStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Demand {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  competenceMonth: number;
  competenceYear: number;
  status: DemandStatus;
  dueDate?: Date;
  completedAt?: Date;
}

export type CreateDemandDto = Omit<Demand, 'id' | 'status' | 'completedAt'>;
