import { IAuditRepository } from './audit.repository';
import { AuditLog, CreateAuditLogDto, ListAuditFilters, PaginatedAuditLogs } from './audit.types';

export class AuditService {
  constructor(private readonly repository: IAuditRepository) {}

  async findAll(filters: ListAuditFilters): Promise<PaginatedAuditLogs> {
    return this.repository.findAll(filters);
  }

  /// Registra um evento de auditoria. Falhas no log sao silenciadas para
  /// nao impactar a operacao principal — auditoria e "best-effort".
  async log(entry: CreateAuditLogDto): Promise<void> {
    try {
      await this.repository.create(entry);
    } catch (err) {
      console.error('[AUDIT] Failed to persist audit log:', err);
    }
  }
}
