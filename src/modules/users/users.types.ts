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

export type CreateUserDto = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUserDto = Partial<Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>;
