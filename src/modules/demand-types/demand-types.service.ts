import { DemandType } from './demand-types.types';

export class DemandTypesService {
  async findAll(_tenantId: string): Promise<DemandType[]> {
    // TODO: query database
    return [];
  }
}
