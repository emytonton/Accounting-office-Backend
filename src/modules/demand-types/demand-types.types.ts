export interface DemandType {
  id: string;
  tenantId: string;
  sector: string;
  name: string;
  hasSubtasks: boolean;
  isActive: boolean;
}

export type CreateDemandTypeDto = Omit<DemandType, 'id'>;
export type UpdateDemandTypeDto = Partial<Omit<DemandType, 'id' | 'tenantId'>>;
