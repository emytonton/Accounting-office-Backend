import { Tenant } from './tenants.types';

export class TenantsService {
  async findAll(): Promise<Tenant[]> {
    // TODO: query database
    return [];
  }

  async findById(_id: string): Promise<Tenant | null> {
    // TODO: query database
    return null;
  }
}
