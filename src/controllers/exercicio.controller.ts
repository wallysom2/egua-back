import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { ExercicioInput } from '../schema/exercicio.schema.js';

export async function listarExercicios(req: Request, res: Response) {
  const { linguagemId } = req.query;
  try {
    const exercicios = await prisma.exercicio.findMany({
      where: linguagemId ? { linguagem_id: Number(linguagemId) } : {},
      include: { exercicio_questao: { include: { questao: true }, orderBy: { ordem: 'asc' } } }
    });
    res.json(exercicios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar exercícios', error });
  }
}

export async function buscarExercicioPorId(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const exercicio = await prisma.exercicio.findUnique({
      where: { id: Number(id) },
      include: { exercicio_questao: { include: { questao: true }, orderBy: { ordem: 'asc' } } }
    });
    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado' });
    res.json(exercicio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar exercício', error });
  }
}

export async function criarExercicio(req: Request, res: Response) {
  const { questoes, ...dadosExercicio } = req.body as ExercicioInput;
  try {
    const exercicio = await prisma.exercicio.create({
      data: {
        ...dadosExercicio,
        exercicio_questao: {
          create: questoes.map(q => ({ questao_id: q.questao_id, ordem: q.ordem }))
        }
      },
      include: { exercicio_questao: { include: { questao: true } } }
    });
    res.status(201).json(exercicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar exercício', error });
  }
}

export async function atualizarExercicio(req: Request, res: Response) {
  const { id } = req.params;
  const { questoes, ...dadosExercicio } = req.body as ExercicioInput;
  try {
    // Para atualizar, normalmente se deleta as relações antigas e cria as novas
    // ou se faz uma lógica mais complexa para atualizar, adicionar e remover individualmente.
    // Por simplicidade, vamos deletar e recriar as exercicio_questao.
    await prisma.exercicio_questao.deleteMany({ where: { exercicio_id: Number(id) } });
    const exercicio = await prisma.exercicio.update({
      where: { id: Number(id) },
      data: {
        ...dadosExercicio,
        exercicio_questao: {
          create: questoes.map(q => ({ questao_id: q.questao_id, ordem: q.ordem }))
        }
      },
      include: { exercicio_questao: { include: { questao: true } } }
    });
    res.json(exercicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar exercício', error });
  }
}

export async function deletarExercicio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    // A relação em cascata no schema deve cuidar de deletar exercicio_questao
    await prisma.exercicio.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar exercício', error });
  }
} 