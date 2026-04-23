import { Company } from './companies.types';

export class CompaniesService {
  async findAll(_tenantId: string): Promise<Company[]> {
    // TODO: query database
    // Inactive companies must not generate new demands but history is preserved
    return [];
  }

  async findById(_tenantId: string, _id: string): Promise<Company | null> {
    return null;
  }
}
