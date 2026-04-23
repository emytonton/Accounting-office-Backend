import { Demand } from './demands.types';

export class DemandsService {
  async findAll(_tenantId: string): Promise<Demand[]> {
    // TODO: query database
    // Delay is calculated when dueDate is set and demand is not completed
    return [];
  }
}
