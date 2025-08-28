import { app } from './app.js';
import dotenv from 'dotenv';
import { connectDatabase } from './utils/database.js';
import { logger } from './utils/logger.js';
import chalk from 'chalk';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Servidor rodando em ${chalk.green(`${HOST}:${PORT}`)}`);
    });
  } catch (error) {
    logger.error('❌ Falha ao iniciar o servidor', error);
    process.exit(1);
  }
};

startServer(); 