import { InMemoryUsersRepository } from '../../modules/users/users.repository';
import { AuthService } from '../../modules/auth/auth.service';
import { emailService } from '../services/email.service';

// Singleton instances shared across modules.
// Replace with DB-backed repositories when persistence is added.
export const usersRepository = new InMemoryUsersRepository();
export const authService = new AuthService(usersRepository, emailService);
