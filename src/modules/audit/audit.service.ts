import { IAuditRepository } from './audit.repository';
import { AuditLog, CreateAuditLogDto } from './audit.types';

export class AuditService {
  constructor(private readonly repository: IAuditRepository) {}

  async findAll(tenantId: string): Promise<AuditLog[]> {
    return this.repository.findAll(tenantId);
  }

  /// Registra um evento de auditoria. Falhas no log são silenciadas para
  /// não impactar a operação principal — auditoria é "best-effort".
  async log(entry: CreateAuditLogDto): Promise<void> {
    try {
      await this.repository.create(entry);
    } catch (err) {
      console.error('[AUDIT] Failed to persist audit log:', err);
    }
  }
}
