import bcrypt from 'bcryptjs';
import { IUsersRepository } from './users.repository';
import { CreateUserDto, PublicUser, UpdateUserDto, User } from './users.types';
import { AppError } from '../../shared/errors/AppError';
import { userSessionInvalidator } from '../../shared/services/user-session-invalidator';

function toPublic(user: User): PublicUser {
  const { passwordHash: _omit, ...publicUser } = user;
  return publicUser;
}

export class UsersService {
  constructor(private readonly repository: IUsersRepository) {}

  async findAll(tenantId: string): Promise<PublicUser[]> {
    const users = await this.repository.findAll(tenantId);
    return users.map(toPublic);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.repository.findByIdentifier(dto.tenantId, dto.identifier);
    if (existing) {
      throw new AppError('Identifier already in use', 409, 'CONFLICT');
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;

    const user = await this.repository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      identifier: dto.identifier,
      passwordHash,
      role: dto.role,
      sector: dto.sector,
      isActive: true,
    });

    return toPublic(user);
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.repository.findById(tenantId, id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (dto.identifier && dto.identifier !== user.identifier) {
      const conflict = await this.repository.findByIdentifier(tenantId, dto.identifier);
      if (conflict && conflict.id !== id) {
        throw new AppError('Identifier already in use', 409, 'CONFLICT');
      }
    }

    const updated = await this.repository.update(tenantId, id, dto);
    return toPublic(updated as NonNullable<typeof updated>);
  }

  async inactivate(tenantId: string, id: string): Promise<PublicUser> {
    const user = await this.repository.findById(tenantId, id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    if (!user.isActive) {
      throw new AppError('User is already inactive', 409, 'ALREADY_INACTIVE');
    }

    const updated = await this.repository.update(tenantId, id, { isActive: false });
    // Invalidate every active session for this user (RF-005).
    userSessionInvalidator.invalidateAllSessions(id);
    return toPublic(updated as NonNullable<typeof updated>);
  }

  async reactivate(tenantId: string, id: string): Promise<PublicUser> {
    const user = await this.repository.findById(tenantId, id);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }
    if (user.isActive) {
      throw new AppError('User is already active', 409, 'ALREADY_ACTIVE');
    }

    const updated = await this.repository.update(tenantId, id, { isActive: true });
    // Clear invalidation cutoff so newly issued tokens after login are accepted.
    userSessionInvalidator.clear(id);
    return toPublic(updated as NonNullable<typeof updated>);
  }
}
