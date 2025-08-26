import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Usar o mesmo segredo JWT que o serviço de auth
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).usuario = decoded;
    next();
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
}

export function autorizarProfessor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if ((req as any).usuario?.tipo !== 'professor') {
    res.status(403).json({ message: 'Acesso restrito a professores' });
    return;
  }
  next();
}

export function autorizarProfessorOuDesenvolvedor(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const tipoUsuario = (req as any).usuario?.tipo;
  if (tipoUsuario !== 'professor' && tipoUsuario !== 'desenvolvedor') {
    res
      .status(403)
      .json({ message: 'Acesso restrito a professores e desenvolvedores' });
    return;
  }
  next();
}
