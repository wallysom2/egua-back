// @ts-nocheck
// Importar usando caminho absoluto relativo ao dist após o build
import { app } from '../dist/app.js';
import { connectDatabase } from '../dist/utils/database.js';
import { logger } from '../dist/utils/logger.js';

// Conectar ao banco de dados quando a função serverless for inicializada
let isConnected = false;
let connectionPromise: Promise<void> | null = null;

const connectIfNeeded = async () => {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      if (!isConnected) {
        try {
          await connectDatabase();
          isConnected = true;
          logger.info('Banco de dados conectado (serverless)');
        } catch (error) {
          logger.error('Erro ao conectar ao banco de dados', error);
          // Não lançar erro para permitir que a função continue
        }
      }
    })();
  }
  return connectionPromise;
};

// Inicializar conexão na primeira execução
connectIfNeeded().catch(err => {
  logger.error('Erro na inicialização do banco', err);
});

// Handler serverless para Vercel - exportar o app Express diretamente
export default async function handler(req: any, res: any) {
  // Garantir que está conectado antes de processar a requisição
  await connectIfNeeded();
  
  // Passar a requisição para o Express
  return app(req, res);
}

