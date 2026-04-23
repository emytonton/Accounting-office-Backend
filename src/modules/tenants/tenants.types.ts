export interface Tenant {
  id: string;
  name: string;
  document: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTenantDto = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>;
