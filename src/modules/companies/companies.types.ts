export interface Company {
  id: string;
  tenantId: string;
  name: string;
  cnpj: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCompanyDto = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCompanyDto = Partial<
  Omit<Company, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;
