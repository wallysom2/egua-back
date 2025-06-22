import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).usuario = decoded;
    next();
  } catch {
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
