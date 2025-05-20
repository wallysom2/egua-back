import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { IniciarExercicioInput } from '../schema/userExercicio.schema.js';
import { v4 as uuidv4 } from 'uuid';

// Extender a interface Request para incluir o usuário autenticado
interface AuthenticatedRequest extends Request {
  usuario?: { usuarioId: string; tipo: string };
}

export async function iniciarExercicio(req: AuthenticatedRequest, res: Response) {
  const { exercicio_id } = req.body as IniciarExercicioInput;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const progressoExistente = await prisma.user_exercicio.findFirst({
      where: {
        usuario_id: usuarioId,
        exercicio_id: exercicio_id,
        status: 'em_andamento' // ou buscar qualquer status para evitar duplicidade
      }
    });

    if (progressoExistente) {
      return res.status(409).json({ message: 'Usuário já iniciou este exercício', data: progressoExistente });
    }

    const novoProgresso = await prisma.user_exercicio.create({
      data: {
        id: uuidv4(),
        usuario_id: usuarioId,
        exercicio_id: exercicio_id,
        status: 'em_andamento'
      }
    });
    res.status(201).json(novoProgresso);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao iniciar exercício', error });
  }
}

export async function finalizarExercicio(req: AuthenticatedRequest, res: Response) {
  const { userExercicioId } = req.params; // ID do registro user_exercicio
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const progresso = await prisma.user_exercicio.findUnique({
      where: { id: userExercicioId }
    });

    if (!progresso) {
      return res.status(404).json({ message: 'Progresso do exercício não encontrado' });
    }

    if (progresso.usuario_id !== usuarioId) {
      return res.status(403).json({ message: 'Usuário não autorizado a finalizar este progresso' });
    }

    const progressoAtualizado = await prisma.user_exercicio.update({
      where: { id: userExercicioId },
      data: {
        status: 'concluido',
        finalizado_em: new Date()
      }
    });
    res.json(progressoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao finalizar exercício', error });
  }
}

export async function listarProgressoUsuario(req: AuthenticatedRequest, res: Response) {
  const usuarioId = req.usuario?.usuarioId;
  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const progressos = await prisma.user_exercicio.findMany({
      where: { usuario_id: usuarioId },
      include: {
        exercicio: { include: { linguagem: true } },
        user_resposta: { include: { questao: true } }
      },
      orderBy: {
        iniciado_em: 'desc'
      }
    });
    res.json(progressos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar progresso do usuário', error });
  }
} 