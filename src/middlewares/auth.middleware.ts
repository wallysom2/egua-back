import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).usuario = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

export function autorizarProfessor(req: Request, res: Response, next: NextFunction) {
  if ((req as any).usuario?.tipo !== 'professor') {
    return res.status(403).json({ message: 'Acesso restrito a professores' });
  }
  next();
}

export function autorizarProfessorOuDesenvolvedor(req: Request, res: Response, next: NextFunction) {
  const tipoUsuario = (req as any).usuario?.tipo;
  if (tipoUsuario !== 'professor' && tipoUsuario !== 'desenvolvedor') {
    return res.status(403).json({ message: 'Acesso restrito a professores e desenvolvedores' });
  }
  next();
} 