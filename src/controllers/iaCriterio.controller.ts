import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { IaCriterioInput } from '../schema/iaCriterio.schema.js';

export async function listarIaCriterios(req: Request, res: Response) {
  try {
    const criterios = await prisma.ia_criterio.findMany();
    res.json(criterios);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar critérios de IA', error });
  }
}

export async function buscarIaCriterioPorId(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const criterio = await prisma.ia_criterio.findUnique({ where: { id: Number(id) } });
    if (!criterio) return res.status(404).json({ message: 'Critério de IA não encontrado' });
    res.json(criterio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar critério de IA', error });
  }
}

export async function criarIaCriterio(req: Request, res: Response) {
  const data = req.body as IaCriterioInput;
  try {
    const criterio = await prisma.ia_criterio.create({ data });
    res.status(201).json(criterio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar critério de IA', error });
  }
}

export async function atualizarIaCriterio(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as IaCriterioInput;
  try {
    const criterio = await prisma.ia_criterio.update({
      where: { id: Number(id) },
      data,
    });
    res.json(criterio);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar critério de IA', error });
  }
}

export async function deletarIaCriterio(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.ia_criterio.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar critério de IA', error });
  }
} 