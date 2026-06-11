import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it before running in production.`,
    );
  }
  return value.trim();
}

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET?.trim();
const dbPassword = process.env.DB_PASSWORD?.trim();

if (isProduction) {
  requireEnv('JWT_SECRET', jwtSecret);
  requireEnv('DB_PASSWORD', dbPassword);
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  HOST: process.env.HOST || '0.0.0.0',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: dbPassword || '',
  DB_NAME: process.env.DB_NAME || 'dorehealth',
  JWT_SECRET:
    jwtSecret ||
    (isProduction ? '' : 'dev-only-change-me-not-for-production'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),
  GOOGLE_CLIENT_IDS: parseCsv(
    process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_WEB_CLIENT_ID,
  ),
  APPLE_CLIENT_IDS: parseCsv(process.env.APPLE_CLIENT_IDS),
};
