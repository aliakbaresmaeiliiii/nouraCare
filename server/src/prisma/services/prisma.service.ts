import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/** MySQL 8+ caching_sha2_password needs RSA key retrieval unless you configure rsa keys. */
function allowPublicKeyFromEnv(): boolean {
  const v = process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL?.trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  return true;
}

function parseAllowPublicKeyFromDatabaseUrl(url: string): boolean | undefined {
  try {
    const parsed = new URL(url.replace(/^mysql:\/\//, 'http://'));
    const q = parsed.searchParams.get('allowPublicKeyRetrieval');
    if (q == null) return undefined;
    return q === 'true' || q === '1';
  } catch {
    return undefined;
  }
}

function getAdapter() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url.replace(/^mysql:\/\//, 'http://'));
      const fromQuery = parseAllowPublicKeyFromDatabaseUrl(url);
      const allowPublicKeyRetrieval =
        fromQuery !== undefined ? fromQuery : allowPublicKeyFromEnv();
      return new PrismaMariaDb({
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: decodeURIComponent(parsed.username) || 'root',
        password: decodeURIComponent(parsed.password) || '',
        database: parsed.pathname?.replace(/^\//, '') || 'CycleTracking',
        connectionLimit: 10,
        connectTimeout: 15000,
        allowPublicKeyRetrieval,
      });
    } catch {
      // fallback to DB_* env vars
    }
  }
  return new PrismaMariaDb({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME?.trim() || 'CycleTracking',
    connectionLimit: 10,
    connectTimeout: 15000,
    allowPublicKeyRetrieval: allowPublicKeyFromEnv(),
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: getAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
