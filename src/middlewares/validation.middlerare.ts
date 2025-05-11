import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validateRequest = (schema: ZodType<any, any, any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error('Validation error', error.errors);
        res.status(400).json({
          success: false,
          message: 'Falha na validação',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        logger.error('Unexpected validation error', error);
        res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }
  };
}; 