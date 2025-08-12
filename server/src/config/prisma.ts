// src/config/prisma.ts
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient();

prisma.$connect()
  .then(() => console.log("✅ Database connected with Prisma"))
  .catch((err) => console.error("❌ DB Connection error:", err));
