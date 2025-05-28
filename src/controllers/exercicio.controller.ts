import { Request, Response } from 'express';
import { ExercicioInput } from '../schema/exercicio.schema.js';
import * as exercicioService from '../services/exercicio.service.js';

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
    const exercicio = await exercicioService.buscarExercicioPorId(id);
    if (!exercicio) return res.status(404).json({ message: 'Exercício não encontrado' });
    res.json(exercicio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar exercício', error });
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
    const exercicio = await exercicioService.atualizarExercicio(id, req.body as ExercicioInput);
    res.json(exercicio);
  } catch (error) {
    console.error('[ERROR] - Prisma Error', error);
    res.status(500).json({ message: 'Erro ao atualizar exercício', error });
  }
}

export async function deletarExercicio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await exercicioService.deletarExercicio(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar exercício', error });
  }
} 