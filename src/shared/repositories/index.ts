import { InMemoryUsersRepository } from '../../modules/users/users.repository';

// Singleton instances shared across modules.
// Replace with DB-backed repositories when persistence is added.
export const usersRepository = new InMemoryUsersRepository();
