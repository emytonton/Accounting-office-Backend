export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type CreateAuditLogDto = Omit<AuditLog, 'id' | 'createdAt'>;
