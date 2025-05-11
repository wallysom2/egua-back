import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

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
});

type QueryEvent = {
  query: string;
  params: string;
  duration: number;
  target: string;
};

prisma.$on('query', (e: QueryEvent) => {
  logger.debug('Prisma Query', { query: e.query, params: e.params, duration: e.duration });
});

prisma.$on('error', (e) => {
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