import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Initialize PrismaClient without type extension
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
}) as any; // Use 'any' type assertion temporarily to avoid TS errors

type QueryEvent = {
  query: string;
  params: string;
  duration: number;
  target: string;
};

// Type assertion for the event handlers


(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma Error', e);
});

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    
    logger.info('✔️  Banco de dados conectado com sucesso');    
    return true;
  } catch (error) {
    logger.error('❌ Falha ao conectar ao banco de dados', error);
    return false;
  }
};

export { prisma }; 