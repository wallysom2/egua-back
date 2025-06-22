import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { logger } from '../utils/logger.js';

export const validateRequest =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar se o body existe
      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: 'Body da requisição é obrigatório',
          errors: [
            {
              code: 'missing_body',
              message: 'O corpo da requisição é obrigatório',
              path: [],
            },
          ],
        });
      }

      // Validar com o schema
      const validatedData = schema.parse(req.body);

      // Atualizar o req.body com os dados validados
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação:', error.errors);
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map((err) => ({
            code: err.code,
            message: err.message,
            path: err.path,
          })),
        });
        return;
      }

      logger.error('Erro desconhecido na validação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno de validação',
      });
      return;
    }
  };
