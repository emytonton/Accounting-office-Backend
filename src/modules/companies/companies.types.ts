export interface Company {
  id: string;
  tenantId: string;
  name: string;
  cnpj: string;
  sector?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCompanyDto = {
  tenantId: string;
  name: string;
  cnpj: string;
  sector?: string;
};

export type UpdateCompanyDto = Partial<{
  name: string;
  cnpj: string;
  sector: string;
}>;

export interface ListCompaniesFilters {
  tenantId: string;
  name?: string;
  cnpj?: string;
  isActive?: boolean;
  sector?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCompanies {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  message?: string;
}
