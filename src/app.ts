import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './shared/middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { tenantsRoutes } from './modules/tenants/tenants.routes';
import { companiesRoutes } from './modules/companies/companies.routes';
import { demandTypesRoutes } from './modules/demand-types/demand-types.routes';
import { demandsRoutes } from './modules/demands/demands.routes';
import { receiptsRoutes } from './modules/receipts/receipts.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { linksRoutes } from './modules/company-demand-type-links/links.routes';
import { exportsRoutes } from './modules/exports/exports.routes';

const app = express();

app.use(helmet());
// CORS_ORIGINS accepts comma-separated list; fallback includes both backend and frontend Vercel URLs
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : env.NODE_ENV === 'production'
  ? [
      env.APP_URL,
      'https://accounting-office-front-end.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ]
  : '*';

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Refresh-Token'],
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      app: env.APP_NAME,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/tenants', tenantsRoutes);
app.use('/companies', companiesRoutes);
app.use('/companies/:companyId/demand-type-links', linksRoutes);
app.use('/demand-types', demandTypesRoutes);
app.use('/demands', demandsRoutes);
app.use('/receipts', receiptsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/audit-logs', auditRoutes);
app.use('/export', exportsRoutes);

app.use(errorHandler);

export { app };
