export interface CompanyDemandTypeLink {
  id: string;
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  subtasksEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLinkDto {
  tenantId: string;
  companyId: string;
  demandTypeId: string;
  subtasksEnabled?: boolean;
}

export interface UpdateLinkDto {
  subtasksEnabled?: boolean;
  isActive?: boolean;
}

export interface CatalogEntry {
  demandTypeId: string;
  name: string;
  sector: string;
  hasSubtasks: boolean;
  isActive: boolean;
  linked: boolean;
  linkId?: string;
  subtasksEnabled?: boolean;
}
