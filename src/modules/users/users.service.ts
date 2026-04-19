import bcrypt from 'bcryptjs';
import { IUsersRepository } from './users.repository';
import { CreateUserDto, PublicUser } from './users.types';
import { AppError } from '../../shared/errors/AppError';

export class UsersService {
  constructor(private readonly repository: IUsersRepository) {}

  async findAll(tenantId: string): Promise<PublicUser[]> {
    const users = await this.repository.findAll(tenantId);
    return users.map(({ passwordHash: _omit, ...user }) => user);
  }

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.repository.findByIdentifier(dto.tenantId, dto.identifier);
    if (existing) {
      throw new AppError('Identifier already in use', 409, 'CONFLICT');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.repository.create({
      tenantId: dto.tenantId,
      name: dto.name,
      identifier: dto.identifier,
      passwordHash,
      role: dto.role,
      sector: dto.sector,
      isActive: true,
    });

    const { passwordHash: _omit, ...publicUser } = user;
    return publicUser;
  }
}
