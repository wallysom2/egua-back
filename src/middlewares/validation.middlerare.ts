import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { logger } from '../utils/logger.js';

export const validateRequest = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação:', error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors
        });
        return;
      }
      
      logger.error('Erro desconhecido na validação:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro de validação'
      });
      return;
    }
  }; 