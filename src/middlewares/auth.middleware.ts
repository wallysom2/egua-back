import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../services/supabase.service.js';
import { TipoUsuario } from '../schema/usuario.schema.js';

/**
 * Interface para o usuário autenticado anexado à request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  nome: string;
  tipo: TipoUsuario;
}

/**
 * Extende a interface Request do Express para incluir o usuário
 */
declare global {
  namespace Express {
    interface Request {
      usuario?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware de autenticação usando tokens Supabase
 * Valida o JWT e extrai informações do usuário
 */
export async function autenticar(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Token não fornecido'
    });
    return;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await supabaseAdmin.validateToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
      return;
    }

    // Extrair informações do user_metadata do Supabase
    const userMetadata = user.user_metadata || {};

    req.usuario = {
      id: user.id,
      email: user.email || '',
      nome: userMetadata.nome || userMetadata.full_name || 'Usuário',
      tipo: (userMetadata.tipo as TipoUsuario) || 'aluno',
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar token Supabase:', error);
    res.status(401).json({
      success: false,
      message: 'Erro ao validar autenticação'
    });
  }
}

/**
 * Middleware para autorizar apenas professores
 */
export function autorizarProfessor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.usuario?.tipo !== 'professor') {
    res.status(403).json({
      success: false,
      message: 'Acesso restrito a professores'
    });
    return;
  }
  next();
}

/**
 * Middleware para autorizar professores ou desenvolvedores
 */
export function autorizarProfessorOuDesenvolvedor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const tipoUsuario = req.usuario?.tipo;
  if (tipoUsuario !== 'professor' && tipoUsuario !== 'desenvolvedor') {
    res.status(403).json({
      success: false,
      message: 'Acesso restrito a professores e desenvolvedores'
    });
    return;
  }
  next();
}
