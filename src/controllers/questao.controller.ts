import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { QuestaoInput } from '../schema/questao.schema.js';

export async function listarQuestoes(req: Request, res: Response) {
  const { conteudoId } = req.query;
  try {
    const questoes = await prisma.questao.findMany({
      where: conteudoId ? { conteudo_id: Number(conteudoId) } : {},
    });
    res.json(questoes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar questões', error });
  }
}

export async function buscarQuestaoPorId(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const questao = await prisma.questao.findUnique({ where: { id: Number(id) } });
    if (!questao) return res.status(404).json({ message: 'Questão não encontrada' });
    res.json(questao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar questão', error });
  }
}

export async function criarQuestao(req: Request, res: Response) {
  const data = req.body as QuestaoInput;
  try {
    const questao = await prisma.questao.create({ data });
    res.status(201).json(questao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar questão', error });
  }
}

export async function atualizarQuestao(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as QuestaoInput;
  try {
    const questao = await prisma.questao.update({
      where: { id: Number(id) },
      data,
    });
    res.json(questao);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar questão', error });
  }
}

export async function deletarQuestao(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.questao.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar questão', error });
  }
} 