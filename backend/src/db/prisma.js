import { PrismaClient } from '@prisma/client';

/** @type {PrismaClient | undefined} */
let prisma;

/**
 * Returns a singleton Prisma client instance.
 * @returns {PrismaClient}
 */
export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

/**
 * Disconnect Prisma (for graceful shutdown).
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

export { prisma };
