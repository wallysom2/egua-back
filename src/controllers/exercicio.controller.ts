import { Request, Response } from 'express';
import { ExercicioInput } from '../schema/exercicio.schema.js';
import * as exercicioService from '../services/exercicio.service.js';
import * as userExercicioService from '../services/userExercicio.service.js';

export async function listarExercicios(req: Request, res: Response) {
  const { linguagemId } = req.query;
  try {
    const exercicios = await exercicioService.listarExercicios(linguagemId as string);
    res.json(exercicios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar exercícios', error });
  }
}

export async function buscarExercicioPorId(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const exercicio = await exercicioService.buscarExercicioPorId(id as string);
    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado' });
    res.json(exercicio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar exercício', error });
  }
}

export async function buscarQuestoesDoExercicio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const questoes = await exercicioService.buscarQuestoesDoExercicio(id as string);
    if (!questoes) return res.status(404).json({ message: 'Exercício não encontrado' });
    res.json(questoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar questões', error });
  }
}

export async function adicionarQuestaoAoExercicio(req: Request, res: Response) {
  const { id } = req.params;
  const { questao_id, ordem } = req.body;

  if (!questao_id) {
    return res.status(400).json({ message: 'questao_id é obrigatório' });
  }

  try {
    const resultado = await exercicioService.adicionarQuestaoAoExercicio(
      id as string,
      questao_id,
      ordem
    );
    res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof Error && error.message.includes('já está vinculada')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro ao adicionar questão ao exercício', error });
  }
}

export async function removerQuestaoDoExercicio(req: Request, res: Response) {
  const { id, questaoId } = req.params;
  try {
    await exercicioService.removerQuestaoDoExercicio(id as string, Number(questaoId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover questão do exercício', error });
  }
}

export async function criarExercicio(req: Request, res: Response) {
  try {
    const exercicio = await exercicioService.criarExercicio(req.body as ExercicioInput);
    res.status(201).json(exercicio);
  } catch (error) {
    console.error('[ERROR] - Prisma Error', error);
    res.status(500).json({ message: 'Erro ao criar exercício', error });
  }
}

export async function atualizarExercicio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const exercicio = await exercicioService.atualizarExercicio(id as string, req.body as ExercicioInput);
    res.json(exercicio);
  } catch (error) {
    console.error('[ERROR] - Prisma Error', error);
    res.status(500).json({ message: 'Erro ao atualizar exercício', error });
  }
}

export async function deletarExercicio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await exercicioService.deletarExercicio(id as string);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar exercício', error });
  }
}

export async function submeterExercicio(req: Request, res: Response) {
  const { id } = req.params;
  const usuarioId = req.usuario?.id;

  if (!usuarioId) {
    return res.status(403).json({ message: 'Usuário não autenticado' });
  }

  try {
    // Verificar se o exercício existe
    const exercicio = await exercicioService.buscarExercicioPorId(id as string);
    if (!exercicio) {
      return res.status(404).json({ message: 'Exercício não encontrado' });
    }

    // Finalizar o exercício usando o serviço de userExercicio
    const resultado = await userExercicioService.finalizarExercicio({
      usuarioId,
      exercicioId: parseInt(id as string),
    });

    res.json({
      message: 'Exercício submetido com sucesso',
      data: resultado.progresso,
      estatisticas: resultado.estatisticas,
      tempo_total: resultado.tempo_total,
    });
  } catch (error) {
    console.error('Erro ao submeter exercício:', error);

    if (error instanceof Error) {
      if (error.message === 'Exercício já foi concluído') {
        return res.status(409).json({ message: error.message });
      }
    }

    res.status(500).json({
      message: 'Erro interno do servidor ao submeter exercício',
      error,
    });
  }
} 