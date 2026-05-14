import { InMemoryUsersRepository } from '../../modules/users/users.repository';
import { PrismaUsersRepository } from '../../modules/users/users.prisma-repository';
import { InMemoryCompaniesRepository } from '../../modules/companies/companies.repository';
import { PrismaCompaniesRepository } from '../../modules/companies/companies.prisma-repository';
import { InMemoryDemandsRepository } from '../../modules/demands/demands.repository';
import { PrismaDemandsRepository } from '../../modules/demands/demands.prisma-repository';
import {
  InMemoryDemandTypesRepository,
  PrismaDemandTypesRepository,
} from '../../modules/demand-types/demand-types.repository';
import {
  InMemoryLinksRepository,
  PrismaLinksRepository,
} from '../../modules/company-demand-type-links/links.repository';
import {
  InMemoryAuditRepository,
  PrismaAuditRepository,
} from '../../modules/audit/audit.repository';
import { AuthService } from '../../modules/auth/auth.service';
import { emailService } from '../services/email.service';
import { env } from '../../config/env';

const isTest = env.NODE_ENV === 'test';

export const usersRepository = isTest ? new InMemoryUsersRepository() : new PrismaUsersRepository();
export const companiesRepository = isTest
  ? new InMemoryCompaniesRepository()
  : new PrismaCompaniesRepository();
export const demandsRepository = isTest
  ? new InMemoryDemandsRepository()
  : new PrismaDemandsRepository();
export const demandTypesRepository = isTest
  ? new InMemoryDemandTypesRepository()
  : new PrismaDemandTypesRepository();
export const linksRepository = isTest
  ? new InMemoryLinksRepository()
  : new PrismaLinksRepository();
export const auditRepository = isTest
  ? new InMemoryAuditRepository()
  : new PrismaAuditRepository();
export const authService = new AuthService(usersRepository, emailService);
