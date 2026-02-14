import { PrismaClient } from '@prisma/client';
import { DATABASE_URL, NODE_ENV } from '@/config';
import { logger } from '@utils/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  });

if (NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Enhanced graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    await prisma.$disconnect();
    logger.info('Database connections closed.');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', async error => {
  logger.error(error, 'Uncaught Exception');
  await prisma.$disconnect();
  process.exit(1);
});

export default prisma;
