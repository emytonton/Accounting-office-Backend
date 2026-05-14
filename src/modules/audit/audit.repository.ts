import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { AuditLog, CreateAuditLogDto } from './audit.types';

export interface IAuditRepository {
  findAll(tenantId: string): Promise<AuditLog[]>;
  create(entry: CreateAuditLogDto): Promise<AuditLog>;
}

function toAuditLog(record: {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
}): AuditLog {
  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    action: record.action,
    entity: record.entity,
    entityId: record.entityId,
    metadata: (record.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: record.createdAt,
  };
}

export class PrismaAuditRepository implements IAuditRepository {
  async findAll(tenantId: string): Promise<AuditLog[]> {
    const records = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return records.map(toAuditLog);
  }

  async create(entry: CreateAuditLogDto): Promise<AuditLog> {
    const record = await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: (entry.metadata ?? null) as never,
      },
    });
    return toAuditLog(record);
  }
}

export class InMemoryAuditRepository implements IAuditRepository {
  private readonly entries: AuditLog[] = [];

  async findAll(tenantId: string): Promise<AuditLog[]> {
    return this.entries.filter((e) => e.tenantId === tenantId);
  }

  async create(entry: CreateAuditLogDto): Promise<AuditLog> {
    const log: AuditLog = { ...entry, id: randomUUID(), createdAt: new Date() };
    this.entries.push(log);
    return log;
  }
}
