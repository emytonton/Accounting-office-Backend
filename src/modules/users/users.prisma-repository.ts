import { prisma } from '../../lib/prisma';
import { IUsersRepository } from './users.repository';
import { User } from './users.types';
import { UserRole } from '../../shared/types';

function toUser(record: {
  id: string;
  tenantId: string;
  name: string;
  identifier: string;
  passwordHash: string | null;
  role: string;
  sector: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    identifier: record.identifier,
    passwordHash: record.passwordHash,
    role: record.role as UserRole,
    sector: record.sector ?? undefined,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaUsersRepository implements IUsersRepository {
  async findAll(tenantId: string, includeInactive = false): Promise<User[]> {
    const records = await prisma.user.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toUser);
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    const record = await prisma.user.findFirst({ where: { tenantId, id } });
    return record ? toUser(record) : null;
  }

  async findByIdentifier(tenantId: string, identifier: string): Promise<User | null> {
    const record = await prisma.user.findUnique({ where: { tenantId_identifier: { tenantId, identifier } } });
    return record ? toUser(record) : null;
  }

  async findByIdentifierGlobally(identifier: string): Promise<User | null> {
    const record = await prisma.user.findFirst({ where: { identifier } });
    return record ? toUser(record) : null;
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const record = await prisma.user.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        identifier: data.identifier,
        passwordHash: data.passwordHash,
        role: data.role,
        sector: data.sector,
        isActive: data.isActive,
      },
    });
    return toUser(record);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<User, 'id' | 'tenantId' | 'passwordHash' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null> {
    const existing = await prisma.user.findFirst({ where: { tenantId, id } });
    if (!existing) return null;

    const record = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.identifier !== undefined && { identifier: data.identifier }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.sector !== undefined && { sector: data.sector }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return toUser(record);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
