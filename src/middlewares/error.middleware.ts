import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

/**
 * Classe para erros operacionais da aplicação
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Mantém o stack trace correto
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para tratamento de erros global
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log do erro
  logger.error('Erro capturado pelo middleware:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Erro operacional conhecido (AppError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos enviados para o banco de dados',
    });
    return;
  }

  // Erros do JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
    return;
  }

  // Erro genérico/desconhecido
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * Trata erros específicos do Prisma
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response): void {
  switch (err.code) {
    case 'P2002':
      // Violação de constraint unique
      const field = (err.meta?.target as string[])?.join(', ') || 'campo';
      res.status(409).json({
        success: false,
        message: `Já existe um registro com esse ${field}`,
      });
      break;

    case 'P2025':
      // Registro não encontrado
      res.status(404).json({
        success: false,
        message: 'Registro não encontrado',
      });
      break;

    case 'P2003':
      // Violação de foreign key
      res.status(400).json({
        success: false,
        message: 'Referência inválida a outro registro',
      });
      break;

    case 'P2014':
      // Violação de relação necessária
      res.status(400).json({
        success: false,
        message: 'Operação violaria uma relação necessária',
      });
      break;

    default:
      res.status(500).json({
        success: false,
        message: 'Erro no banco de dados',
      });
  }
}

/**
 * Middleware para capturar erros assíncronos
 * Wrapper para async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

