import { InMemoryUsersRepository } from '../../modules/users/users.repository';
import { InMemoryCompaniesRepository } from '../../modules/companies/companies.repository';
import { InMemoryDemandsRepository } from '../../modules/demands/demands.repository';
import { AuthService } from '../../modules/auth/auth.service';
import { emailService } from '../services/email.service';

// Singleton instances shared across modules.
// Replace with DB-backed repositories when persistence is added.
export const usersRepository = new InMemoryUsersRepository();
export const companiesRepository = new InMemoryCompaniesRepository();
export const demandsRepository = new InMemoryDemandsRepository();
export const authService = new AuthService(usersRepository, emailService);
