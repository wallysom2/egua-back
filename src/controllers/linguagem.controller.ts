import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import { LinguagemInput } from '../schema/linguagem.schema.js';

export async function listarLinguagens(req: Request, res: Response) {
  try {
    const linguagens = await prisma.linguagem.findMany();
    res.json(linguagens);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar linguagens', error });
  }
}

export async function buscarLinguagemPorId(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const linguagem = await prisma.linguagem.findUnique({ where: { id: Number(id) } });
    if (!linguagem) return res.status(404).json({ message: 'Linguagem não encontrada' });
    res.json(linguagem);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar linguagem', error });
  }
}

export async function criarLinguagem(req: Request, res: Response) {
  const data = req.body as LinguagemInput;
  try {
    const linguagem = await prisma.linguagem.create({ data });
    res.status(201).json(linguagem);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar linguagem', error });
  }
}

export async function atualizarLinguagem(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body as LinguagemInput;
  try {
    const linguagem = await prisma.linguagem.update({
      where: { id: Number(id) },
      data
    });
    res.json(linguagem);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar linguagem', error });
  }
}

export async function deletarLinguagem(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.linguagem.delete({ where: { id: Number(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar linguagem', error });
  }
} 