import { app } from './app.js';
import dotenv from 'dotenv';
import { connectDatabase } from './utils/database.js';
import { logger } from './utils/logger.js';
import chalk from 'chalk';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${chalk.green(PORT)}`);
    });
  } catch (error) {
    logger.error('❌ Falha ao iniciar o servidor', error);
    process.exit(1);
  }
};

startServer(); 