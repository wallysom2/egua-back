// @ts-nocheck
// Handler serverless para Vercel usando import dinâmico
let appInstance: any = null;
let isConnected = false;
let initPromise: Promise<any> | null = null;

async function getApp() {
  if (!initPromise) {
    initPromise = (async () => {
      if (!appInstance) {
        try {
          // Usar caminho relativo ao diretório de trabalho da Vercel
          // A Vercel coloca os arquivos compilados em /var/task/
          const appPath = process.env.VERCEL 
            ? './dist/app.js'  // Na Vercel, dist/ está no mesmo nível
            : '../dist/app.js'; // Localmente
          
          const appModule = await import(appPath);
          appInstance = appModule.default || appModule.app;
          
          // Conectar ao banco de dados
          if (!isConnected) {
            const dbPath = process.env.VERCEL
              ? './dist/utils/database.js'
              : '../dist/utils/database.js';
            const loggerPath = process.env.VERCEL
              ? './dist/utils/logger.js'
              : '../dist/utils/logger.js';
            
            const { connectDatabase } = await import(dbPath);
            await connectDatabase();
            isConnected = true;
            const { logger } = await import(loggerPath);
            logger.info('Banco de dados conectado (serverless)');
          }
        } catch (error) {
          console.error('Erro ao inicializar app:', error);
          // Tentar importar logger para logar o erro
          try {
            const loggerPath = process.env.VERCEL
              ? './dist/utils/logger.js'
              : '../dist/utils/logger.js';
            const { logger } = await import(loggerPath);
            logger.error('Erro ao inicializar app', error);
          } catch (e) {
            console.error('Erro ao importar logger:', e);
          }
        }
      }
      return appInstance;
    })();
  }
  return initPromise;
}

// Handler serverless para Vercel
export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    if (!app) {
      res.status(500).json({ error: 'App não inicializado' });
      return;
    }
    app(req, res);
  } catch (error) {
    console.error('Erro no handler:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

