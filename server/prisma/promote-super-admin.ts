/**
 * One-shot: promote aliakbaresmaeili98@gmail.com to SUPER_ADMIN.
 * Usage: npx ts-node prisma/promote-super-admin.ts
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const seedDir = path.resolve(__dirname);
const envPaths = [
  path.resolve(seedDir, '..', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
];
const envPath = envPaths.find((p) => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const EMAIL = 'aliakbaresmaeili98@gmail.com';

const envUrl = process.env.DATABASE_URL?.trim();
const databaseUrl =
  envUrl ||
  (process.env.DB_HOST &&
    `mysql://${encodeURIComponent(process.env.DB_USER || 'root')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${(process.env.DB_NAME || 'CycleTracking').trim()}`);

if (!databaseUrl) {
  console.error('No DATABASE_URL / DB_* in .env');
  process.exit(1);
}

const adapter = new PrismaMariaDb(databaseUrl);
const db = new PrismaClient({ adapter });

async function main() {
  const existing = await db.user.findUnique({ where: { email: EMAIL } });
  if (!existing) {
    console.error(
      `User not found: ${EMAIL}. Sign up once on the app, then re-run this script.`,
    );
    process.exit(1);
  }

  const updated = await db.user.update({
    where: { email: EMAIL },
    data: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  console.log(
    `OK: ${updated.email} → role=${updated.role} status=${updated.status}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
