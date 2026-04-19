import { UserRole } from '../../shared/types';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  identifier: string;
  passwordHash: string;
  role: UserRole;
  sector?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface CreateUserDto {
  tenantId: string;
  name: string;
  identifier: string;
  password: string;
  role: UserRole;
  sector?: string;
}

export type UpdateUserDto = Partial<
  Omit<User, 'id' | 'tenantId' | 'passwordHash' | 'createdAt' | 'updatedAt'>
>;
