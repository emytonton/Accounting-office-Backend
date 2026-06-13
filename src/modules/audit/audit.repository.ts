import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { AuditLog, CreateAuditLogDto, ListAuditFilters, PaginatedAuditLogs } from './audit.types';

export interface IAuditRepository {
  findAll(filters: ListAuditFilters): Promise<PaginatedAuditLogs>;
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
  async findAll(filters: ListAuditFilters): Promise<PaginatedAuditLogs> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId: filters.tenantId };
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      };
    }

    const [records, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: records.map(toAuditLog),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async findAll(filters: ListAuditFilters): Promise<PaginatedAuditLogs> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    let results = this.entries.filter((e) => {
      if (e.tenantId !== filters.tenantId) return false;
      if (filters.entity && e.entity !== filters.entity) return false;
      if (filters.action && e.action !== filters.action) return false;
      if (filters.userId && e.userId !== filters.userId) return false;
      if (filters.dateFrom && e.createdAt < filters.dateFrom) return false;
      if (filters.dateTo && e.createdAt > filters.dateTo) return false;
      return true;
    });

    const total = results.length;
    results = results.slice((page - 1) * limit, page * limit);

    return { data: results, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(entry: CreateAuditLogDto): Promise<AuditLog> {
    const log: AuditLog = { ...entry, id: randomUUID(), createdAt: new Date() };
    this.entries.push(log);
    return log;
  }
}
