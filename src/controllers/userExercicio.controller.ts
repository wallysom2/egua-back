import { Request, Response } from 'express';
import * as userExercicioService from '../services/userExercicio.service.js';
import { prisma } from '../utils/database.js';

// Usar o tipo global definido no auth.middleware.ts
// Request.usuario está tipado com AuthenticatedUser

export async function finalizarExercicio(
  req: Request,
  res: Response,
) {
  const { usuarioId, exercicioId } = req.params;

  if (!usuarioId) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  if (!exercicioId) {
    return res.status(400).json({ message: 'ID do exercício é obrigatório' });
  }

  try {
    const resultado = await userExercicioService.finalizarExercicio({
      usuarioId: usuarioId as string,
      exercicioId: parseInt(exercicioId as string),
    });

    res.json({
      message: 'Exercício concluído com sucesso',
      data: resultado.progresso,
      estatisticas: resultado.estatisticas,
      tempo_total: resultado.tempo_total,
    });
  } catch (error) {
    console.error('Erro ao finalizar exercício:', error);

    if (error instanceof Error) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Exercício não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Exercício já foi concluído') {
        return res.status(409).json({ message: error.message });
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor ao finalizar exercício',
      error,
    });
  }
}

export async function finalizarExercicioPorQuery(
  req: Request,
  res: Response,
) {
  const { usuarioId, exercicioId } = req.query;

  if (!usuarioId || typeof usuarioId !== 'string') {
    return res.status(400).json({ message: 'ID do usuário é obrigatório' });
  }

  if (!exercicioId || typeof exercicioId !== 'string') {
    return res.status(400).json({ message: 'ID do exercício é obrigatório' });
  }

  try {
    const resultado = await userExercicioService.finalizarExercicio({
      usuarioId,
      exercicioId: parseInt(exercicioId),
    });

    res.json({
      message: 'Exercício concluído com sucesso',
      data: resultado.progresso,
      estatisticas: resultado.estatisticas,
      tempo_total: resultado.tempo_total,
    });
  } catch (error) {
    console.error('Erro ao finalizar exercício:', error);

    if (error instanceof Error) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Exercício não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Exercício já foi concluído') {
        return res.status(409).json({ message: error.message });
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor ao finalizar exercício',
      error,
    });
  }
}

export async function listarProgressoUsuario(
  req: Request,
  res: Response,
) {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const progressos = await userExercicioService.listarProgressoUsuario(
      usuarioId,
    );
    res.json(progressos);
  } catch (error) {
    console.error('Erro ao listar progresso do usuário:', error);
    res.status(500).json({
      message: 'Erro ao listar progresso do usuário',
      error,
    });
  }
}

export async function obterStatusExercicio(
  req: Request,
  res: Response,
) {
  const { exercicioId } = req.params;
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const status = await userExercicioService.obterStatusExercicio(
      usuarioId,
      parseInt(exercicioId as string),
    );
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status do exercício:', error);
    res.status(500).json({
      message: 'Erro ao obter status do exercício',
      error,
    });
  }
}

export async function listarExerciciosConcluidos(
  req: Request,
  res: Response,
) {
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const exerciciosConcluidos =
      await userExercicioService.listarExerciciosConcluidos(usuarioId);
    res.json(exerciciosConcluidos);
  } catch (error) {
    console.error('Erro ao listar exercícios concluídos:', error);
    res.status(500).json({
      message: 'Erro ao listar exercícios concluídos',
      error,
    });
  }
}

export async function obterResumoProgresso(
  req: Request,
  res: Response,
) {
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    const resumo = await userExercicioService.obterResumoProgresso(usuarioId);
    res.json(resumo);
  } catch (error) {
    console.error('Erro ao obter resumo do progresso:', error);
    res.status(500).json({
      message: 'Erro ao obter resumo do progresso',
      error,
    });
  }
}

export async function verificarEConcluirExercicio(
  req: Request,
  res: Response,
) {
  const { userExercicioId } = req.params;
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  if (!userExercicioId) {
    return res
      .status(400)
      .json({ message: 'ID do progresso do exercício é obrigatório' });
  }

  try {
    // Buscar o progresso com todas as informações necessárias
    const progresso = await prisma.user_exercicio.findFirst({
      where: {
        id: userExercicioId as string,
        usuario_id: usuarioId,
        status: 'em_andamento',
      },
      include: {
        exercicio: {
          include: {
            exercicio_questao: true,
          },
        },
        user_resposta: {
          include: {
            questao: true,
            ia_evaluacao: { include: { ia_criterio: true } },
          },
        },
      },
    });

    if (!progresso) {
      return res.status(404).json({
        message: 'Progresso do exercício não encontrado ou já concluído',
      });
    }

    // Verificar se o usuário ainda existe
    await userExercicioService.verificarUsuarioExiste(usuarioId);

    // Verificar se o exercício ainda existe
    await userExercicioService.verificarExercicioExiste(progresso.exercicio_id);

    const totalQuestoes = progresso.exercicio.exercicio_questao.length;
    const respostasComAnalise = progresso.user_resposta.filter(
      (resposta: any) => resposta.ia_evaluacao.length > 0,
    ).length;
    const respostasAprovadas = progresso.user_resposta.filter((resposta: any) =>
      resposta.ia_evaluacao.some((avaliacao: any) => avaliacao.aprovado),
    ).length;

    // Verificar se todas as questões foram respondidas e aprovadas
    const todasQuestoesRespondidas = respostasComAnalise === totalQuestoes;
    const todasRespostasAprovadas = respostasAprovadas === totalQuestoes;

    if (todasQuestoesRespondidas && todasRespostasAprovadas) {
      // Marcar exercício como concluído automaticamente
      const progressoAtualizado =
        await userExercicioService.atualizarProgressoExistente(userExercicioId as string);
      const estatisticas = userExercicioService.calcularEstatisticas(
        progressoAtualizado.user_resposta,
      );
      const tempoTotal = userExercicioService.calcularTempoTotal(
        progressoAtualizado.iniciado_em,
        progressoAtualizado.finalizado_em,
      );

      return res.json({
        message:
          'Exercício concluído automaticamente! Todas as questões foram respondidas e aprovadas.',
        concluido_automaticamente: true,
        data: progressoAtualizado,
        estatisticas: {
          ...estatisticas,
          percentual_conclusao: 100,
          percentual_aprovacao: 100,
        },
        tempo_total: tempoTotal,
      });
    } else {
      // Retornar status atual sem concluir
      const estatisticas = userExercicioService.calcularEstatisticas(
        progresso.user_resposta,
      );

      return res.json({
        message: 'Exercício ainda não pode ser concluído',
        concluido_automaticamente: false,
        pode_concluir: false,
        data: progresso,
        estatisticas,
        requisitos: {
          todas_questoes_respondidas: todasQuestoesRespondidas,
          todas_respostas_aprovadas: todasRespostasAprovadas,
          questoes_faltando: totalQuestoes - respostasComAnalise,
          respostas_para_revisar: respostasComAnalise - respostasAprovadas,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao verificar conclusão do exercício:', error);
    res.status(500).json({
      message: 'Erro interno do servidor ao verificar conclusão do exercício',
      error,
    });
  }
}

export async function iniciarExercicio(
  req: Request,
  res: Response,
) {
  const { exercicioId } = req.params;
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  if (!exercicioId) {
    return res.status(400).json({ message: 'ID do exercício é obrigatório' });
  }

  try {
    const progresso = await userExercicioService.iniciarExercicio(
      usuarioId,
      parseInt(exercicioId as string),
    );

    res.json({
      message: 'Exercício iniciado com sucesso',
      data: progresso,
    });
  } catch (error) {
    console.error('Erro ao iniciar exercício:', error);

    if (error instanceof Error) {
      if (error.message === 'Usuário não encontrado') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === 'Exercício não encontrado') {
        return res.status(404).json({ message: error.message });
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor ao iniciar exercício',
      error,
    });
  }
}
