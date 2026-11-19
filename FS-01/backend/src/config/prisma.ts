import { PrismaClient } from '@prisma/client';
import env from './env.js';
import logger from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let isPrismaConnected = false;

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    },
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Check live connection health to PostgreSQL via Prisma.
 */
export const prismaHealthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaConnected = true;
    return true;
  } catch {
    isPrismaConnected = false;
    return false;
  }
};

/**
 * Attempt to connect to PostgreSQL via Prisma Client.
 * When `required = true`, throws an error if connection fails.
 */
export const connectPrisma = async (required = false): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    isPrismaConnected = true;
    logger.info('[PostgreSQL/Prisma] Connected successfully to database');
    return true;
  } catch (error: any) {
    isPrismaConnected = false;
    if (required) {
      logger.error(`[PostgreSQL/Prisma] Fatal: Failed to connect to required PostgreSQL at ${env.DATABASE_URL}: ${error.message}`);
      throw new Error(`Failed to connect to required PostgreSQL database via Prisma: ${error.message}`);
    }
    logger.warn(`[PostgreSQL/Prisma] Connection notice: Unable to connect to PostgreSQL at ${env.DATABASE_URL}. Details: ${error.message}`);
    return false;
  }
};

export const isPrismaAvailable = (): boolean => {
  return isPrismaConnected;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (isPrismaConnected) {
    await prisma.$disconnect();
    isPrismaConnected = false;
    logger.info('[PostgreSQL/Prisma] Disconnected gracefully');
  }
};

export default prisma;
