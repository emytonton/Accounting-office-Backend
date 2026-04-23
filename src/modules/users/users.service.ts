import { User } from './users.types';

export class UsersService {
  async findAll(_tenantId: string): Promise<User[]> {
    // TODO: query database
    return [];
  }

  async findById(_tenantId: string, _id: string): Promise<User | null> {
    // TODO: query database
    return null;
  }
}
