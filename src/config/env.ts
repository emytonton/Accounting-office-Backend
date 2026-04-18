import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  APP_NAME: process.env.APP_NAME || 'Accounting HUB',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30m',
};

if (!env.JWT_SECRET && env.NODE_ENV !== 'test') {
  console.warn('[WARNING] JWT_SECRET is not set. Configure it in your .env file.');
}
