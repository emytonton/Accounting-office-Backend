import { AuditLog, CreateAuditLogDto } from './audit.types';

export class AuditService {
  async findAll(_tenantId: string): Promise<AuditLog[]> {
    // TODO: query database
    return [];
  }

  async log(_entry: CreateAuditLogDto): Promise<void> {
    // TODO: persist audit log entry
  }
}
