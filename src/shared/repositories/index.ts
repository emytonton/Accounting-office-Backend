import { InMemoryUsersRepository } from '../../modules/users/users.repository';
import { PrismaUsersRepository } from '../../modules/users/users.prisma-repository';
import { InMemoryCompaniesRepository } from '../../modules/companies/companies.repository';
import { InMemoryDemandsRepository } from '../../modules/demands/demands.repository';
import { AuthService } from '../../modules/auth/auth.service';
import { emailService } from '../services/email.service';
import { env } from '../../config/env';

const isTest = env.NODE_ENV === 'test';

export const usersRepository = isTest ? new InMemoryUsersRepository() : new PrismaUsersRepository();
export const companiesRepository = new InMemoryCompaniesRepository();
export const demandsRepository = new InMemoryDemandsRepository();
export const authService = new AuthService(usersRepository, emailService);
