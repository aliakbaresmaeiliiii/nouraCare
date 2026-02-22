import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function getAdapter() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url.replace(/^mysql:\/\//, 'http://'));
      return new PrismaMariaDb({
        host: parsed.hostname || '127.0.0.1',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        user: decodeURIComponent(parsed.username) || 'root',
        password: decodeURIComponent(parsed.password) || '',
        database: parsed.pathname?.replace(/^\//, '') || 'CycleTracking',
        connectionLimit: 10,
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
