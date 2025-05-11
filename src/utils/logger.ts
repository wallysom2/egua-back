import chalk from 'chalk';

export const logger = {
  info: (message: string, data?: any) => {
    console.log(
      `${chalk.cyan('[INFO]')} - ${message}`,
      data ? data : ''
    );
  },

  error: (message: string, error?: any) => {
    console.error(
      `${chalk.red('[ERROR]')} - ${message}`,
      error ? error : ''
    );
  },

  warn: (message: string, data?: any) => {
    console.warn(
      `${chalk.yellow('[WARN]')} - ${message}`,
      data ? data : ''
    );
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `${chalk.blue('[DEBUG]')} - ${message}`,
        data ? data : ''
      );
    }
  }
}; 