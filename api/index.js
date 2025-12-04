// Importar do código fonte - a Vercel compilará automaticamente
import { app } from '../dist/app.js';
import { connectDatabase } from '../dist/utils/database.js';
import { logger } from '../dist/utils/logger.js';
// Conectar ao banco de dados quando a função serverless for inicializada
let isConnected = false;
const connectIfNeeded = async () => {
    if (!isConnected) {
        try {
            await connectDatabase();
            isConnected = true;
            logger.info('Banco de dados conectado (serverless)');
        }
        catch (error) {
            logger.error('Erro ao conectar ao banco de dados', error);
            // Não lançar erro para permitir que a função continue
        }
    }
};
// Inicializar conexão na primeira execução
connectIfNeeded().catch(err => {
    logger.error('Erro na inicialização do banco', err);
});
// Handler serverless para Vercel - exportar o app Express diretamente
export default app;
