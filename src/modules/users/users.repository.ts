import { randomUUID } from 'crypto';
import { User } from './users.types';

export interface IUsersRepository {
  findAll(tenantId: string): Promise<User[]>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByIdentifier(tenantId: string, identifier: string): Promise<User | null>;
  findByIdentifierGlobally(identifier: string): Promise<User | null>;
  create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
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

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }
}
