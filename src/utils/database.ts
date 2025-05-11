import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Manually extend the PrismaClient to include our models
// This is a workaround for the case when prisma generate fails
interface CustomPrismaClient extends PrismaClient {
  usuario: {
    findUnique: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  }
}

// Initialize PrismaClient
const prismaBase = new PrismaClient({
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

// Create a custom client with our models
const prisma = prismaBase as CustomPrismaClient;

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