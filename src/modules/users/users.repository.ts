import { randomUUID } from 'crypto';
import { User } from './users.types';

export interface IUsersRepository {
  findAll(tenantId: string): Promise<User[]>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByIdentifier(tenantId: string, identifier: string): Promise<User | null>;
  findByIdentifierGlobally(identifier: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(
    tenantId: string,
    id: string,
    data: Partial<Omit<User, 'id' | 'tenantId' | 'passwordHash' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export class InMemoryUsersRepository implements IUsersRepository {
  private readonly users: User[] = [];

  async findAll(tenantId: string): Promise<User[]> {
    return this.users.filter((u) => u.tenantId === tenantId && u.isActive);
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    return this.users.find((u) => u.tenantId === tenantId && u.id === id) ?? null;
  }

  async findByIdentifier(tenantId: string, identifier: string): Promise<User | null> {
    return this.users.find((u) => u.tenantId === tenantId && u.identifier === identifier) ?? null;
  }

  async findByIdentifierGlobally(identifier: string): Promise<User | null> {
    return this.users.find((u) => u.identifier === identifier) ?? null;
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const user: User = { ...data, id: randomUUID(), createdAt: now, updatedAt: now };
    this.users.push(user);
    return user;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Omit<User, 'id' | 'tenantId' | 'passwordHash' | 'createdAt' | 'updatedAt'>>,
  ): Promise<User | null> {
    const user = this.users.find((u) => u.tenantId === tenantId && u.id === id);
    if (!user) return null;
    if (data.name !== undefined) user.name = data.name;
    if (data.identifier !== undefined) user.identifier = data.identifier;
    if (data.role !== undefined) user.role = data.role;
    if (data.sector !== undefined) user.sector = data.sector;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    user.updatedAt = new Date();
    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }
}
