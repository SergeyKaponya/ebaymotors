import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (process.env.DATABASE_URL === undefined) {
    return null; // fallback to in-memory store
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
