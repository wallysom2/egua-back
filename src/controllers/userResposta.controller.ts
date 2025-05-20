import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { SubmeterRespostaInput } from '../schema/userResposta.schema.js';
import { v4 as uuidv4 } from 'uuid';

// Extender a interface Request para incluir o usuário autenticado
interface AuthenticatedRequest extends Request {
  usuario?: { usuarioId: string; tipo: string };
}

export async function submeterResposta(req: AuthenticatedRequest, res: Response) {
  const { user_exercicio_id, questao_id, resposta } = req.body as SubmeterRespostaInput;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se o user_exercicio_id pertence ao usuário logado e se está em andamento
    const progressoExercicio = await prisma.user_exercicio.findFirst({
      where: {
        id: user_exercicio_id,
        usuario_id: usuarioId,
        // status: 'em_andamento' // Opcional: permitir submeter apenas se em andamento
      }
    });

    if (!progressoExercicio) {
      return res.status(404).json({ message: 'Progresso do exercício não encontrado ou não pertence ao usuário' });
    }
    
    // Verificar se a questão pertence ao exercício
    const questaoNoExercicio = await prisma.exercicio_questao.findFirst({
        where: {
            exercicio_id: progressoExercicio.exercicio_id,
            questao_id: questao_id
        }
    });

    if (!questaoNoExercicio) {
        return res.status(400).json({ message: 'Questão não faz parte do exercício informado' });
    }

    // Verificar se já existe uma resposta para essa questão nesse progresso
    // Se sim, poderia ser um update ou impedir nova submissão.
    // Por ora, vamos permitir criar uma nova, o que pode ser útil para histórico, mas pode precisar de ajuste.
    const novaResposta = await prisma.user_resposta.create({
      data: {
        id: uuidv4(),
        user_exercicio_id,
        questao_id,
        resposta
        // ia_evaluacao será preenchida depois
      }
    });

    // AQUI seria o ponto para chamar a IA para avaliação assíncrona
    // Ex: chamarServicoAvaliacaoIA(novaResposta.id, resposta);

    res.status(201).json(novaResposta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao submeter resposta', error });
  }
}

export async function listarRespostasPorProgresso(req: AuthenticatedRequest, res: Response) {
  const { userExercicioId } = req.params;
  const usuarioId = req.usuario?.usuarioId;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se o user_exercicio_id pertence ao usuário logado
    const progressoExercicio = await prisma.user_exercicio.findFirst({
      where: { id: userExercicioId, usuario_id: usuarioId }
    });

    if (!progressoExercicio) {
      return res.status(404).json({ message: 'Progresso do exercício não encontrado ou não pertence ao usuário' });
    }

    const respostas = await prisma.user_resposta.findMany({
      where: { user_exercicio_id: userExercicioId },
      include: { questao: true, ia_evaluacao: { include: { ia_criterio: true } } },
      orderBy: { submetido_em: 'asc' }
    });
    res.json(respostas);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar respostas', error });
  }
} 